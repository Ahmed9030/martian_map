import Map from '@/components/Map';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">خريطة MapLibre في Next.js</h1>
      <div className="border rounded-xl overflow-hidden shadow-lg">
        <Map />
      </div>
    </main>
  );
}