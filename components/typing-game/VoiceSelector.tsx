import React from 'react';
import styled from '@emotion/styled';

const VoiceSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #bdc3c7;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
  }
`;

const VoiceSelect = styled.select`
  background-color: #1e1e2e;
  color: white;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  min-width: 200px;
  font-size: 0.85rem;
  margin-top: 0.5rem;

  @media (min-width: 768px) {
    margin-top: 0;
  }
`;

interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  onChange: (value: string) => void;
}

export function VoiceSelector({ voices, selectedVoiceName, onChange }: VoiceSelectorProps) {
  if (voices.length === 0) {
    return null;
  }

  return (
    <VoiceSelectorContainer>
      <span>请选择朗读声音：</span>
      <VoiceSelect value={selectedVoiceName} onChange={(event) => onChange(event.target.value)}>
        {voices.map((voice) => (
          <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
            {voice.name} {voice.lang ? `(${voice.lang})` : ''}
          </option>
        ))}
      </VoiceSelect>
    </VoiceSelectorContainer>
  );
}
