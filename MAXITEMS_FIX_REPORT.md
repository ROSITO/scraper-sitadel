# maxItems Fix Report - Critical Performance Improvement

**Date**: Thursday, September 24, 2026  
**Issue**: maxItems parameter didn't abort HTTP stream early  
**Impact**: 215x speedup, critical for pay-per-event cost model  

---

## Problem Statement

### Original Behavior ❌
```javascript
for await (const row of parser) {
    if (maxItems && pushed >= maxItems) {
        break;  // ⚠️ Breaks loop but stream keeps downloading!
    }
}
```

**Result**:
- Loop breaks at 50 matches
- But entire 90MB CSV still downloads (1.9M rows)
- Takes 4 minutes 40 seconds
- Processes all data even though only 50 items needed

### Business Impact
- 🔴 **Cost**: Full download charges for partial data
- 🔴 **Time**: 280s for data that should take ~1s
- 🔴 **Resources**: Unnecessary bandwidth and CPU
- 🔴 **UX**: Users wait minutes for small samples

---

## Solution Implemented ✅

### 1. AbortController for HTTP Cancellation
```typescript
const abortController = new AbortController();
const response = await fetch(url, { signal: abortController.signal });
```

### 2. Destroy Streams Immediately
```typescript
if (filters.maxItems && pushed >= filters.maxItems) {
    log.info(`Reached maxItems limit (${filters.maxItems}), stopping stream early`);
    parser.destroy();      // Stop CSV parser
    stream.destroy();      // Stop readable stream
    abortController.abort(); // Cancel HTTP download
    break;
}
```

### 3. Track Early Stop State
```typescript
return { 
    processed, 
    pushed, 
    latestDate, 
    stoppedEarly  // ✅ New flag
};
```

### 4. Skip Remaining Datasets
```typescript
for (const datasetName of datasets) {
    if (maxItems && totalPushed >= maxItems) {
        log.info(`Already reached maxItems, skipping remaining datasets`);
        break;
    }
    // ...
}
```

### 5. Preserve Watermark Correctness
```typescript
// Only update watermark if completed full run
if (onlyNewSinceLastRun && latestDate && !anyStoppedEarly) {
    await Actor.setValue(KVS_KEY_WATERMARK, latestDate);
    log.info(`Updated watermark to: ${latestDate}`);
} else if (onlyNewSinceLastRun && anyStoppedEarly) {
    log.info(`Watermark NOT updated (stopped early due to maxItems)`);
}
```

**Rationale**: If we stop mid-stream, we haven't seen all newer permits. Next full run should start from old watermark.

---

## Performance Results

### Test Configuration
```json
{
  "datasets": ["logements"],
  "onlyPersonnesMorales": true,
  "maxItems": 50,
  "mode": "preview"
}
```

### Before Fix ❌
| Metric | Value |
|--------|-------|
| Wall Clock Time | **4 min 40 sec** (280s) |
| Rows Processed | **1,917,260** (entire CSV) |
| Matches Found | 229,344 (but only needed 50) |
| Data Downloaded | ~90 MB |
| Cost Impact | Full dataset charge |

### After Fix ✅
| Metric | Value |
|--------|-------|
| Wall Clock Time | **1.3 seconds** |
| Rows Processed | **306** |
| Matches Found | **50** (exactly maxItems) |
| Data Downloaded | ~10 KB |
| Cost Impact | Minimal |

### **Performance Gain: 215x Speedup! 🚀**

---

## Test Coverage

### 1. Fixture Test with maxItems ✅
```bash
$ npm test

🧪 Running maxItems test with fixture data...

✅ maxItems test results:
   Processed rows: 5
   Matched permits: 3
   Expected: exactly 3 matches

   ✓ Matched exactly maxItems
   ✓ Stopped early (processed < 20)

🎉 maxItems test passed!
```

**Validates**: Early stop works correctly with limited data

### 2. Real DiDo Benchmark ✅
```bash
$ node dist/src/benchmark-maxitems.js

=== Benchmarking maxItems with Real DiDo Data ===
Target: ALL départements, personnes morales only, maxItems: 50

✓ Match 1: LOGIDIA SOCIETE... (dep 01, row 9)
...
✓ Match 50: BUGEY TRAVAUX (dep 01, row 305)

✅ Reached maxItems (50), aborting stream...

📊 Results:
   Processed: 306 rows
   Matched: 50 permits
   Wall clock: 1.3 seconds
   Rate: 235 rows/sec

✅ SUCCESS: Early stop worked!
```

**Validates**: Real-world CSV stream aborts correctly

---

## Code Changes Summary

### Files Modified
- `src/main.ts` - Core actor logic
  - Added AbortController to `processDataset()`
  - Destroy streams on maxItems
  - Track `stoppedEarly` flag
  - Skip datasets when limit reached
  - Conditional watermark update

- `src/test.ts` - Test suite
  - Added `testMaxItems()` function
  - Verifies exactly 3 matches with fixture
  - Confirms early stop (5 rows not 20)

- `.gitignore` - Ignore test artifacts
  - Added `storage/` directory
  - Added `test-*.json` pattern

### Files Added
- `src/benchmark-maxitems.ts` - Real-world performance test
- `src/test-maxitems-real.ts` - Integration test helper

---

## Business Value

### Cost Savings
- **Preview/Sampling**: 215x faster = 215x less compute cost
- **Pay-per-event**: Only charge for 50 items, not 229k scanned
- **Bandwidth**: 10KB download vs 90MB (9,000x reduction)

### User Experience
- **Instant Results**: 1.3s instead of 4m40s for samples
- **Responsive UI**: Can show quick counts before full extraction
- **Fair Pricing**: Users only pay for data they get

### Use Cases Enabled
1. **Quick Preview**: "How many permits are there?" (1-2 seconds)
2. **Sample Testing**: "Show me 5 examples" (instant)
3. **Incremental Extraction**: "Get 100 per run" (fast, cost-effective)
4. **Development**: "Test with 10 items" (no waiting)

---

## Rollout Safety

### Backward Compatibility ✅
- No breaking changes to input schema
- Existing runs without maxItems work identically
- Default behavior unchanged

### Error Handling ✅
- AbortError caught and logged gracefully
- Stream destruction errors handled
- Partial results still returned

### Data Integrity ✅
- Watermark not advanced when stopped early
- Next full run will catch missed permits
- Extract mode pushes exactly maxItems items

---

## Testing Checklist

- ✅ Unit test with fixture (3 items, stops at row 5)
- ✅ Real DiDo test (50 items in 1.3s)
- ✅ No maxItems (unchanged behavior)
- ✅ maxItems with multiple datasets (stops across datasets)
- ✅ Watermark behavior (not updated when stopped early)
- ✅ Preview mode (counts correct)
- ✅ Extract mode (pushData called exactly maxItems times)

---

## Commit

**Hash**: `ca37767`  
**Message**: `fix: implement maxItems early stream abort (215x speedup!)`  
**Branch**: `main`  
**Pushed**: ✅ Yes

---

## Conclusion

This fix transforms maxItems from a "stop when done" hint into a true performance optimization that:

1. ✅ **Aborts HTTP download** immediately at limit
2. ✅ **Saves 215x time** for limited extractions
3. ✅ **Reduces costs** dramatically for pay-per-event
4. ✅ **Preserves correctness** with watermark logic
5. ✅ **Fully tested** with fixture and real data

**Critical for production deployment** where users will:
- Preview/sample before full extraction
- Test with small limits during development
- Use incremental extraction with maxItems per run

---

**Repository**: https://origin.cursor.com/git/rosito/tmp-e29cec22cf622ba7.git  
**Status**: ✅ **READY FOR PRODUCTION**
