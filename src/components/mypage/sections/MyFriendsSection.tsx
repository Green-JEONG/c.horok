import Image from "next/image";

export default function MyFriendsSection() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">구독</h2>

      <ul className="space-y-3">
        {[1, 2, 3].map((id) => (
          <li
            key={id}
            className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted"
          >
            <Image
              src="/logo.svg"
              alt="subscription"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="font-medium">구독 {id}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
