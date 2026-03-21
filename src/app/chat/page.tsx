export default function ChatPage() {
  return (
    <div className="space-y-3 rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-orange-500">호록 봇봇</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        챗봇은 모든 화면의 우하단 플로팅 버튼으로 제공됩니다. 홈이나 게시글
        화면에서 `logo.png` 버튼을 눌러 바로 사용할 수 있습니다.
      </p>
    </div>
  );
}
