'use client';

import { ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface NoteDisplayProps {
  title: string;
  content: string | null;
  isLoading: boolean;
}

export function NoteDisplay({ title, content, isLoading }: NoteDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast({
        title: 'Copied to clipboard!',
        description: `${title} has been copied.`,
      });
    }
  };

  return (
    <Card className="shadow-lg h-[60vh] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {content && !isLoading && (
          <Button variant="ghost" size="icon" onClick={handleCopy} className="no-print">
            <ClipboardCopy className="h-4 w-4" />
            <span className="sr-only">Copy {title}</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full scroll-area-h">
          <div className="pr-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </div>
            ) : content ? (
              <p className="whitespace-pre-wrap text-sm text-foreground/90">{content}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nothing to display yet.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
