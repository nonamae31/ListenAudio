async function testDelete() {
  const baseUrl = 'http://localhost:3000/api';
  const testUrl = 'https://example.com/delete-test.mp3';

  console.log("1. Add a record to delete");
  const postRes = await fetch(`${baseUrl}/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: testUrl })
  });
  const record = await postRes.json();
  console.log("Added record:", record);

  console.log("2. Test DELETE /audio");
  const delRes = await fetch(`${baseUrl}/audio?id=${record.id}`, {
    method: 'DELETE',
  });
  console.log("DELETE result:", delRes.status, await delRes.json());

  console.log("3. Verify it is gone");
  const getAllRes = await fetch(`${baseUrl}/audio`);
  const allRecords = await getAllRes.json();
  const found = allRecords.find((r: any) => r.id === record.id);
  console.log("Is record still there?", found ? "YES (FAIL)" : "NO (SUCCESS)");
}

testDelete().catch(console.error);
