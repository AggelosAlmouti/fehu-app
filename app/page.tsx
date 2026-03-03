import Image from 'next/image';
import styles from './page.module.css';
import design from '@/public/design.png';

export default function Home(){
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Coming Soon...</h1>
      <Image 
        src={design}
        alt="App design" 
        style={{width: '300px', height: 'auto'}}
      />
    </main>
  )
}