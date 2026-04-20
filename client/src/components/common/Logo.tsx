/**
 * @description 서비스의 메인 로고 컴포넌트입니다.
 * SVG 코드를 분리하여 ChatWindow의 가독성을 높였습니다.
 */
export default function Logo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      className={`${className} text-blue-500`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M2 12c.5.5 1 1 2.5 1s3-1.5 4-2c1.5-.5 3 .5 4 .5s2.5 1 4 1 3-1.5 4-2 2 .5 2 .5M2 17c.5.5 1 1 2.5 1s3-1.5 4-2c1.5-.5 3 .5 4 .5s2.5 1 4 1 3-1.5 4-2 2 .5 2 .5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
