import { Head } from '@inertiajs/react';
import { Bot, Send, Trash2, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { chat } from '@/routes';
import { send } from '@/routes/chat';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type Props = {
    model: string;
};

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function Chat({ model }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) {
            return;
        }

        const nextMessages: Message[] = [
            ...messages,
            { role: 'user', content: trimmed },
        ];
        setMessages(nextMessages);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(send.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ messages: nextMessages }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || data.message || 'Failed to get a response.',
                );
            }

            setMessages([...nextMessages, data.message]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'An unexpected error occurred.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="AI Chat" />
            <div className="flex h-[calc(100vh-5rem)] flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="size-5 text-primary" />
                        <h1 className="text-lg font-semibold">Groq Chatbot</h1>
                        <Badge variant="secondary" className="text-xs">
                            {model}
                        </Badge>
                    </div>
                    {messages.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setMessages([]);
                                setError(null);
                            }}
                        >
                            <Trash2 className="mr-1.5 size-4" />
                            Clear
                        </Button>
                    )}
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    {messages.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                            <Bot className="size-10 opacity-40" />
                            <p className="text-sm">
                                Send a message to start chatting with Groq (
                                {model}).
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 ${
                                        msg.role === 'user'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`}
                                >
                                    <div
                                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground'
                                        }`}
                                    >
                                        {msg.role === 'user' ? (
                                            <User className="size-4" />
                                        ) : (
                                            <Bot className="size-4" />
                                        )}
                                    </div>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-start gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-foreground">
                                        <Bot className="size-4" />
                                    </div>
                                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                                        <Spinner />
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={loading}
                        autoFocus
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !input.trim()}>
                        {loading ? <Spinner /> : <Send className="size-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </>
    );
}

Chat.layout = {
    breadcrumbs: [
        {
            title: 'AI Chat',
            href: chat(),
        },
    ],
};

