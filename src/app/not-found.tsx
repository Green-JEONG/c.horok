import ErrorState from "@/components/common/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      code={404}
      message="요청하신 페이지를 찾을 수 없습니다. 주소가 올바른지 확인해 주세요."
    />
  );
}
