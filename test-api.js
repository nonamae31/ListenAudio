async function test() {
  const baseUrl = 'http://localhost:3000/api';
  const testUrl = 'https://example.com/test2.mp3';

  console.log("1. Test POST /audio");
  const postRes = await fetch(`${baseUrl}/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: testUrl })
  });
  console.log("POST result:", postRes.status, await postRes.json());

  console.log("2. Test PUT /audio/status");
  const putRes = await fetch(`${baseUrl}/audio/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: testUrl, lastPosition: 42.5 })
  });
  console.log("PUT result:", putRes.status, await putRes.json());

  console.log("3. Test GET /audio/status");
  const getRes = await fetch(`${baseUrl}/audio/status?url=${encodeURIComponent(testUrl)}`);
  console.log("GET result:", getRes.status, await getRes.json());

  console.log("4. Test GET /audio");
  const getAllRes = await fetch(`${baseUrl}/audio`);
  console.log("GET All result:", getAllRes.status, (await getAllRes.json()).slice(0, 2));
}

test().catch(console.error);
