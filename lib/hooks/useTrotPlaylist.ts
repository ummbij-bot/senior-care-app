"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";

export type TrotSong = {
  id: string;
  title: string;
  artist: string;
  youtube_id: string;
  thumbnail_url: string | null;
  sort_order: number;
};

/**
 * 트로트 플레이리스트 훅
 * - Supabase에서 활성 곡 목록 fetch
 * - 현재 곡 인덱스 관리
 * - 이전/다음 곡 이동
 */
export function useTrotPlaylist() {
  const [songs, setSongs] = useState<TrotSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylist() {
      const { data } = await supabase
        .from("trot_playlist")
        .select("id, title, artist, youtube_id, thumbnail_url, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data) setSongs(data as TrotSong[]);
      setLoading(false);
    }
    fetchPlaylist();
  }, []);

  const currentSong = songs[currentIndex] ?? null;

  const nextSong = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % songs.length);
  }, [songs.length]);

  const prevSong = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + songs.length) % songs.length);
  }, [songs.length]);

  const goToSong = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return { songs, currentSong, currentIndex, loading, nextSong, prevSong, goToSong };
}
