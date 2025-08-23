"use client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Bot, User, MessageCircle, Sparkles, Shield, Clock, AlertTriangle, Heart, Zap, Brain } from "lucide-react"
import Link from "next/link"
import { ChanseyFAB } from "@/components/chansey-fab"
import { ChanseyMascot } from "@/components/chansey-mascot"
import { toast, Toaster } from "sonner"

// Ensure consistent typing for conversation history
interface ConversationPart {
  role: "user" | "model"
  parts: { text: string }[]
}

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  isLoading?: boolean
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Chansey, your AI dermatology assistant. I'm here to help with general skin care questions and provide information about skin conditions. However, please remember that I'm an AI assistant and cannot replace professional medical advice. For serious concerns, always consult a qualified dermatologist. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ConversationPart[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages(prev => [...prev, userMessage, botMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: "user", parts: [{ text: inputMessage }] },
        { role: "model", parts: [{ text: data.message }] }
      ])

      // Update the bot message with the response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, text: data.message, isLoading: false }
            : msg
        )
      )

    } catch (error) {
      console.error("Error sending message:", error)
      
      // Update the bot message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { 
                ...msg, 
                text: "I'm sorry, I'm having trouble responding right now. Please try again or contact support if the issue persists.", 
                isLoading: false 
              }
            : msg
        )
      )
      
      toast.error("Failed to get response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "What causes acne?",
    "How to treat dry skin?",
    "Sun protection tips?",
    "Common skin allergies?",
    "When to see a dermatologist?",
    "Skincare routine for sensitive skin?"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <ChanseyMascot size="sm" />
                <h1 className="text-xl font-bold text-gray-800">AI Dermatology Assistant</h1>
              </div>
            </div>
          </div>
        </div>
     
      </header>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <ChanseyMascot size="md" />

              </div>
              <h2 className="text-4xl font-bold text-gray-800">Chansey AI</h2>
            </div>
             <p className="text-gray-600 max-w-2xl mx-auto text-md mb-2">
              Get instant answers to your skin care questions and dermatological concerns. 
              Our AI assistant provides general information and guidance.
            </p>
            
            {/* Features */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>100% Safe & Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-500" />
                <span>Instant Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>AI Assistant Only</span>
              </div>
            </div> 

            {/* Disclaimer */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700 font-medium">
                ⚠️ This is an AI assistant. For serious conditions, always consult a qualified dermatologist.
              </span>
            </div>
          </div>
          </div>


          {/* Chat Interface */}
          <div className="space-y-4">
          {messages.map((message) => (
  <div
    key={message.id}
    className={`flex gap-3 ${
      message.sender === "user" ? "justify-end" : "justify-start"
    }`}
  >
    {message.sender === "bot" && (
      <Avatar className="w-8 h-8 border-2 border-pink-200">
        <AvatarImage src="/api/placeholder/32/32?text=C" />
        <AvatarFallback className="bg-pink-500 text-white text-xs">
          C
        </AvatarFallback>
      </Avatar>
    )}

    <div
      className={`max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl ${
        message.sender === "user"
          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white ml-auto"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {message.isLoading ? (
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="text-sm">Chansey AI is typing...</span>
        </div>
      ) : (
        <div className="space-y-4">
<div className="prose prose-pink ">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.text}
  </ReactMarkdown>
</div>
          <div className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )}
    </div>

    {message.sender === "user" && (
      <Avatar className="w-8 h-8 border-2 border-pink-200">
        <AvatarImage src="/api/placeholder/32/32?text=U" />
        <AvatarFallback className="bg-pink-500 text-white text-xs">
          U
        </AvatarFallback>
      </Avatar>
    )}
  </div>
))}
</div>

                          {/* Quick Questions */}
          <div className="mt-6">
            <div className="flex flex-wrap justify-center gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage(question)}
                  className="text-xs border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
              {/* Input Area */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your skin concern..."
                    className="flex-1 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Your conversations are private and secure
                </div>
              </div>

        


          {/* Additional Info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">AI-Powered</h3>
                <p className="text-sm text-gray-600">Advanced AI technology for accurate skin care information</p>
              </CardContent>
            </Card>

            <Card className="border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Safe & Secure</h3>
                <p className="text-sm text-gray-600">Your privacy and data security are our top priority</p>
              </CardContent>
            </Card>

            <Card className="border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Medical Disclaimer</h3>
                <p className="text-sm text-gray-600">AI assistant only - consult professionals for serious conditions</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Features Section */}
          <div className="mt-8">
            <Card className="border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">Why Choose Chansey AI?</CardTitle>
                <CardDescription className="text-base">Experience the future of dermatological assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Instant Responses</h4>
                        <p className="text-sm text-gray-600">Get immediate answers to your skin care questions without waiting</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Personalized Care</h4>
                        <p className="text-sm text-gray-600">Tailored recommendations based on your specific skin concerns</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Privacy First</h4>
                        <p className="text-sm text-gray-600">Your conversations are completely private and secure</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Always Learning</h4>
                        <p className="text-sm text-gray-600">Continuously updated with the latest dermatological research</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      

      {/* Floating Chansey AI Button */}
      {/* <ChanseyFAB /> */}
      <Toaster />
    </div>
  )
}
