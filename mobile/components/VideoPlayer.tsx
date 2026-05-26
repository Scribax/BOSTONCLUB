import React, { useEffect, useState, memo } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ViewStyle } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  style?: ViewStyle;
  paused?: boolean;
}

// In-memory URI cache: remote URL → local file URI (persists for app session)
const uriCache: Record<string, string> = {};

async function getCachedUri(remoteUri: string): Promise<string> {
  if (uriCache[remoteUri]) return uriCache[remoteUri];
  try {
    const { getInfoAsync, makeDirectoryAsync, downloadAsync, cacheDirectory } =
      await import('expo-file-system/legacy');
    const cacheDir = cacheDirectory + 'boston_videos/';
    const filename = remoteUri.split('/').pop()?.split('?')[0] ?? 'video.mp4';
    const localUri = cacheDir + filename;

    const dirInfo = await getInfoAsync(cacheDir);
    if (!dirInfo.exists) await makeDirectoryAsync(cacheDir, { intermediates: true });

    const fileInfo = await getInfoAsync(localUri);
    if (fileInfo.exists) {
      uriCache[remoteUri] = localUri;
      return localUri;
    }

    const result = await downloadAsync(remoteUri, localUri);
    uriCache[remoteUri] = result.uri;
    return result.uri;
  } catch {
    return remoteUri; // Fallback: stream from remote
  }
}

export const VideoPlayer = memo(({ uri, style, paused = false }: VideoPlayerProps) => {
  const [localUri, setLocalUri] = useState<string>(uri);

  useEffect(() => {
    let cancelled = false;
    getCachedUri(uri).then((resolved) => {
      if (!cancelled) setLocalUri(resolved);
    });
    return () => { cancelled = true; };
  }, [uri]);

  const player = useVideoPlayer({ uri: localUri, metadata: { title: '' } }, (player) => {
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
