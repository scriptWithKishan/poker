/*
  GameLog keeps recent table events visible for players.
  It is intentionally read-only, so game history cannot accidentally change
  while editing the action controls or table layout.
*/
export default function GameLog({ log }) {
  return (
    <section className="panel log-panel">
      <h2>Hand Log</h2>
      <ol>
        {log.slice(0, 8).map((entry, index) => (
          <li key={`${entry}-${index}`}>{entry}</li>
        ))}
      </ol>
    </section>
  )
}
