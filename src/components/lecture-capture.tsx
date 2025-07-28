'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { UploadCloud, Mic, Square, Loader2, Timer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LectureCaptureProps {
  onAudioSubmit: (dataUri: string) => void;
  isProcessing: boolean;
}

export function LectureCapture({ onAudioSubmit, isProcessing }: LectureCaptureProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        onAudioSubmit(dataUri);
      };
      reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; // Reset input
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
  
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          onAudioSubmit(dataUri);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop media stream
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: 'Could not access microphone. Please check permissions.',
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <Tabs defaultValue="upload" className="w-full mt-8">
      <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
        <TabsTrigger value="upload" disabled={isProcessing}>Upload File</TabsTrigger>
        <TabsTrigger value="record" disabled={isProcessing}>Record Audio</TabsTrigger>
      </TabsList>
      <TabsContent value="upload">
        <Card className="border-2 border-dashed">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-4 h-48">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                  <span>Choose a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="audio/*,video/*" disabled={isProcessing} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-muted-foreground">Supports MP3, WAV, MP4, etc.</p>
              {isProcessing && <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="record">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-4 h-48">
              {!isRecording ? (
                <>
                  <Mic className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Click the button to start recording</p>
                  <Button onClick={startRecording} disabled={isProcessing} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Mic className="mr-2 h-5 w-5" /> Start Recording
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center text-2xl font-mono text-red-500">
                    <Timer className="mr-2 h-8 w-8 animate-pulse" />
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                  <p className="text-muted-foreground">Recording in progress...</p>
                  <Button onClick={stopRecording} variant="destructive" size="lg">
                    <Square className="mr-2 h-5 w-5" /> Stop Recording
                  </Button>
                </>
              )}
               {isProcessing && !isRecording && <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
