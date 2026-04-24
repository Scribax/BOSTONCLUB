import React from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, ViewStyle } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  style?: ViewStyle;
}

export const VideoPlayer = ({ uri, style }: VideoPlayerProps) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      style={style}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
};
