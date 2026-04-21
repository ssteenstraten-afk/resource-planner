export function Documentatie() {
  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src="/documentatie.html"
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="Technische documentatie"
      />
    </div>
  )
}
