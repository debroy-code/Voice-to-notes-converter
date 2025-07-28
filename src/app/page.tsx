'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookText, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LectureCapture } from '@/components/lecture-capture';
import { NoteDisplay } from '@/components/note-display';
import { transcribeAudio, TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import { summarizeText, SummarizeTextInput } from '@/ai/flows/summarize-text';

export default function Home() {
  const { toast } = useToast();
  const [transcription, setTranscription] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const isProcessing = isLoadingTranscription || isLoadingSummary;

  const handleAudioSubmit = (dataUri: string) => {
    setAudioDataUri(dataUri);
    setTranscription(null);
    setSummary(null);
    setIsLoadingTranscription(true);
    setIsLoadingSummary(false); // Reset summary loading
  };

  const handleExport = () => {
    window.print();
  };

  const runTranscription = useCallback(async (input: TranscribeAudioInput) => {
    try {
      const result = await transcribeAudio(input);
      if (result.transcription) {
        setTranscription(result.transcription);
      } else {
        throw new Error('Transcription failed to produce text.');
      }
    } catch (error) {
      console.error('Transcription Error:', error);
      toast({
        variant: 'destructive',
        title: 'Transcription Failed',
        description: 'Could not transcribe the audio. Please try again.',
      });
      setTranscription(null); // Clear transcription on error
    } finally {
      setIsLoadingTranscription(false);
    }
  }, [toast]);
  
  const runSummarization = useCallback(async (input: SummarizeTextInput) => {
    setIsLoadingSummary(true);
    try {
      const result = await summarizeText(input);
      setSummary(result.summary);
    } catch (error) {
      console.error('Summarization Error:', error);
      toast({
        variant: 'destructive',
        title: 'Summarization Failed',
        description: 'Could not summarize the text. Please try again.',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [toast]);

  useEffect(() => {
    if (audioDataUri) {
      runTranscription({ audioDataUri });
    }
  }, [audioDataUri, runTranscription]);
  
  useEffect(() => {
    if (transcription && !summary) {
      runSummarization({ text: transcription });
    }
  }, [transcription, summary, runSummarization]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="no-print sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <BookText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">NoteForge</h1>
          </div>
          <Button
            onClick={handleExport}
            disabled={!transcription && !summary}
            variant="default"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Printer className="mr-2 h-4 w-4" />
            Export Notes
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mx-auto max-w-5xl flex flex-col gap-10">
          <section className="no-print">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Capture Your Lecture</h2>
              <p className="mt-2 text-muted-foreground">Upload an audio file or record directly to get started.</p>
            </div>
            <LectureCapture onAudioSubmit={handleAudioSubmit} isProcessing={isProcessing} />
          </section>

          {(transcription || isLoadingTranscription || summary || isLoadingSummary) && (
             <div id="print-area" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <NoteDisplay
                title="Transcription"
                content={transcription}
                isLoading={isLoadingTranscription}
              />
              <NoteDisplay
                title="Summary"
                content={summary}
                isLoading={isLoadingSummary}
              />
            </div>
          )}
        </div>
      </main>
       <footer className="no-print py-4 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Firebase Genkit.</p>
      </footer>
    </div>
  );
}
