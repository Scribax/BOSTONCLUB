import React, { useEffect } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, ViewStyle } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  style?: ViewStyle;
  paused?: boolean; // When true, the video is paused (e.g. when the tab loses focus)
}

export const VideoPlayer = ({ uri, style, paused = false }: VideoPlayerProps) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Pause/resume based on the paused prop
  useEffect(() => {
    if (!player) return;
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [paused, player]);

  return (
    <VideoView
      style={style}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
};
