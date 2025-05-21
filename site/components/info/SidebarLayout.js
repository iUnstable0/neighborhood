// SidebarLayout.jsx
import Head from "next/head";
import { useState, useRef, useEffect } from 'react'
import { M_PLUS_Rounded_1c } from "next/font/google";
import { Link } from 'next/link'
import styles from "@/styles/Sidebar.module.css";

export default function SidebarLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const sidebarRef = useRef(null)

  // close sidebar if clicking outside of it (on mobile)
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={styles.layout}>

      <button
        className={styles.menuToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        ref={sidebarRef}
      >
        <nav>
        <img style={{maxWidth: "100%", marginBottom: 16, width: "100%", zIndex: 3}} src="/neighborhoodLogo.png"/>

        <a className={styles.sidebarButton} href="/">Main Website</a>

        <hr/>

        <a className={styles.sidebarButton} href="/info">🏡 Info</a>
        <a className={styles.sidebarButton} href="/info/getting-started">💻 Getting Started</a>
        <a className={styles.sidebarButton} href="/info/faq">❓ FAQ</a>
        <a className={styles.sidebarButton} href="/info/for-parents">👥 For Parents</a>

        </nav>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
