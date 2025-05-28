import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PostsViewComponent from '@/components/PostsViewComponent';
import { M_PLUS_Rounded_1c } from "next/font/google";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});

export default function PostView() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/getPost?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        setPost(data.post);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffe5c7',
        fontFamily: 'var(--font-m-plus-rounded)',
        color: '#644c36'
      }}>
        Loading...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffe5c7',
        fontFamily: 'var(--font-m-plus-rounded)',
        color: '#644c36'
      }}>
        {error || 'Post not found'}
      </div>
    );
  }

  return (
    <div className={mPlusRounded.variable} style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#ffe5c7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <PostsViewComponent
        isExiting={false}
        onClose={() => router.push('/')}
        posts={[post]}
        userData={null}
      />
    </div>
  );
} 