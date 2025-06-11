fetch('http://localhost:8000/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://api.github.com/repos/KIRANBADAKURAVA/Qbot/contents',
  }),
})
  .then(res => res.json())
  .then(data => {
    console.log('🧠 Code Summary:', data);
  })
  .catch(err => console.error('❌ Error:', err));
