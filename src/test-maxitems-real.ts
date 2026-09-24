// Test maxItems with real DiDo data
import { Actor, log } from 'apify';

// Mock Actor.getInput to return our test input
const originalGetInput = Actor.getInput;
(Actor as any).getInput = async () => ({
    datasets: ['logements'],
    departementCodes: ['75'],
    onlyPersonnesMorales: true,
    maxItems: 50,
    mode: 'preview'
});

// Import and run main after mocking
import('./main.js').then(() => {
    console.log('Test completed!');
}).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
