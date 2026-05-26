import React, { useEffect, memo } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, ViewStyle } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  style?: ViewStyle;
  paused?: boolean; // When true, the video is paused (e.g. when the tab loses focus)
}

export const VideoPlayer = memo(({ uri, style, paused = false }: VideoPlayerProps) => {
  const player = useVideoPlayer({ uri, metadata: { title: '' } }, (player) => {
    player.loop = true;
    player.muted = true;
    if (!paused) player.play();
  });

  useEffect(() => {
    if (!player) return;
    if (paused) {
      player.pause();
    } else {
      player.loop = true;
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
});
