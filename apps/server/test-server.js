async function test() {
  console.log('--- Testing BaseIndex Server Endpoints ---');

  // 1. Health
  const healthRes = await fetch('http://localhost:4000/health');
  const healthJson = await healthRes.json();
  console.log('✅ Health Response:', JSON.stringify(healthJson));

  // 2. Gas
  const gasRes = await fetch('http://localhost:4000/api/portfolio/gas');
  const gasJson = await gasRes.json();
  console.log('✅ Live Gas Response:', JSON.stringify(gasJson));

  // 3. Portfolio
  const portRes = await fetch('http://localhost:4000/api/portfolio');
  const portJson = await portRes.json();
  console.log(`✅ Portfolio Response: ${portJson.holdings.length} assets, Total Value: $${portJson.totalValueUSD}`);

  // 4. Chat-to-Trade
  const chatRes = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Allocate $100 across 60% NVDA and 40% TSLA',
      walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    })
  });
  const chatJson = await chatRes.json();
  console.log('✅ Chat Execution Success:', chatJson.success);
  console.log('✅ Trades Executed:', chatJson.executionResult?.allocations?.length);
  console.log('✅ Explorer URL 1:', chatJson.executionResult?.allocations?.[0]?.explorerUrl);
}

test().catch(console.error);
