// This needs `npm install @openai/openai`
'use server';
/**
 * @fileOverview A flow to transcribe audio files to text.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import OpenAI from 'openai';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio or video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the audio file.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    // Extract the base64 encoded audio data from the data URI
    const base64Audio = input.audioDataUri.split(',')[1];

    // Decode the base64 data into a Buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Initialize OpenAI client with API key from environment variables
    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

    // Create a temporary file
    //const tmpFileName = `audio-${Date.now()}.mp3`;

    // Write the buffer to the temporary file
    //fs.writeFileSync(tmpFileName, audioBuffer);

    // Call the OpenAI transcription API
    try {
      const transcription = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: {name: 'recording.mp3', content: audioBuffer},
        response_format: 'text',
      });
      return {transcription};
    } catch (error: any) {
      console.error(error);
      throw new Error(`Error transcribing audio: ${error.message}`);
    } finally {
      // Clean up the temporary file
      //fs.unlinkSync(tmpFileName);
    }
  }
);

