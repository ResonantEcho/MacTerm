import React from 'react';
import SSHSession from './SSHSession';
import PlaceholderSession from './PlaceholderSession';

export default function TerminalPane({ tab }) {
  const { protocol } = tab;

  if (protocol === 'SSH') {
    return <SSHSession tab={tab} />;
  }

  // RDP and VNC will be implemented in later phases
  return <PlaceholderSession tab={tab} />;
}
