export default function TeacherCoursesList() {
  return (
    <div className="rounded-md border p-4">
      <div className="h-90 space-y-2 overflow-y-auto rounded-md border border-dashed p-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 rounded border border-dashed bg-muted/20" />
        ))}
      </div>
    </div>
  );
}
