import { SquarePen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCommunityPostPage() {
  return (
    <main className="px-[10vw] py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SquarePen className="size-5" />
            发布帖子
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            发帖编辑器正在建设中，下一步可接入标题、正文、图片上传和话题选择。
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
