export function getScoreTagClass(score: number | null) {
  if (score === null) {
    return "bg-muted text-muted-foreground";
  }
  if (score < 3) {
    return "bg-red-50 text-red-600";
  }
  if (score < 4) {
    return "bg-yellow-50 text-yellow-700";
  }
  return "bg-green-50 text-green-700";
}
