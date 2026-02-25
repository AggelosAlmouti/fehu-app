import Image from 'next/image';

export default function Home(){
  return (
    <main className="min-h-screen flex flex-col gap-1 items-center justify-center">
      <h1 className="text-xl font-bold">Coming Soon...</h1>
        <Image 
          src="/design.png" 
          alt="Fehu sheep logo" 
          width={300} 
          height={300}
        />
    </main>
  )
}