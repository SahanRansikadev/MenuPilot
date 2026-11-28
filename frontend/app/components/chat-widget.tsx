"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

const openingMessage: ChatMessage = {
  id: 1,
  role: "assistant",
  text: "Hi! I’m the MenuPilot demo assistant. What can I help you find?",
};

const suggestions = ["View hotel menus", "Create a booking", "Dietary options", "Contact support"];

function getDemoReply(message: string) {
  const query = message.toLowerCase();

  if (/menu|food|meal|breakfast|lunch|dinner/.test(query)) {
    return "You can browse sample menus for Villa Serene, Harbor House, Mountain Table, and Golden Palm from Dashboard → Menus.";
  }
  if (/book|guest|reservation|stay|event/.test(query)) {
    return "To create a demo guest booking, open Dashboard → Guests → Add guest and follow the steps. You can also plan a meal from the dashboard.";
  }
  if (/diet|allerg|vegan|vegetarian|gluten|dairy/.test(query)) {
    return "The sample menus include some vegetarian, vegan, gluten-free, and dairy-free options. Please confirm allergies and dietary needs directly with the property before ordering.";
  }
  if (/contact|support|help|email|phone/.test(query)) {
    return "You can reach the MenuPilot team at hello@menupilot.com or +94 11 234 5678.";
  }

  return "I’m a demo assistant and can help with menus, bookings, dietary options, and support. For anything else, contact hello@menupilot.com.";
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([openingMessage]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(2);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "assistant",
      text: getDemoReply(trimmed),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  function resetChat() {
    setMessages([openingMessage]);
    setDraft("");
    nextMessageId.current = 2;
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <section className="chat-panel" aria-label="MenuPilot demo assistant">
          <header className="chat-header">
            <span className="chat-header-icon"><Sparkles size={17} /></span>
            <div className="chat-header-copy">
              <b>MenuPilot assistant</b>
              <small><i /> Demo assistant · here to help</small>
            </div>
            <button type="button" className="chat-header-action" onClick={resetChat} aria-label="Reset chat">
              <RotateCcw size={16} />
            </button>
            <button type="button" className="chat-header-action" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={19} />
            </button>
          </header>

          <div className="chat-messages" aria-live="polite">
            {messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <p>{message.text}</p>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="chat-suggestions" aria-label="Suggested questions">
                {suggestions.map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <label className="chat-input-label">
              <span className="sr-only">Message the MenuPilot assistant</span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about menus or bookings..."
                maxLength={500}
              />
            </label>
            <button type="submit" disabled={!draft.trim()} aria-label="Send message">
              <Send size={17} />
            </button>
          </form>
          <div className="chat-demo-note">Demo replies · Not connected to a live AI service</div>
        </section>
      )}

      <button
        type="button"
        className="chat-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close MenuPilot chat" : "Open MenuPilot chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="chat-launcher-close" size={27} />
        ) : (
          <img
            src="https://res.cloudinary.com/uf1peiew/image/upload/v1795887330/download.gif"
            alt=""
          />
        )}
      </button>
    </div>
  );
}
