"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, ArrowLeft, CheckCircle, AlertTriangle, Info, Download, Share } from "lucide-react"
import Link from "next/link"
import { ChanseyFAB } from "@/components/chansey-fab"
import { ChanseyMascot } from "@/components/chansey-mascot"

interface SkinCondition {
  name: string;
  confidence: number;
  urgent?: boolean;
}

export default function AnalyzeSkinPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [conditions, setConditions] = useState<SkinCondition[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG, WEBP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setError(null)
    const file = e.dataTransfer.files[0]
    if (!file) return

    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleAnalyze = async () => {
    if (!uploadedFile) return
    
    setIsAnalyzing(true)
    setAnalysisComplete(false)
    setError(null)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("image", uploadedFile)

      // Simulate progress for better UX
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const res = await fetch(process.env.NEXT_PUBLIC_API_URL || "/api/analyze-skin", {
        method: "POST",
        body: formData,
      })

      clearInterval(interval)
      setProgress(100)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const data = await res.json()
      
      // Use structured data if available, fallback to raw analysis
      if (data.conditions && data.recommendations) {
        setConditions(data.conditions)
        setRecommendations(data.recommendations)
      } else if (data.analysis) {
        // Fallback parsing
        setConditions([{ name: "AI Analysis", confidence: 100 }])
        setRecommendations([data.analysis])
      } else {
        throw new Error("Unexpected response format")
      }

      setAnalysisComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setConditions([])
      setRecommendations([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
              <h1 className="text-xl font-bold text-gray-800">Skinsey - Skin Analyzer</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">AI-Powered Skin Analysis</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload a clear photo of your skin concern and get instant AI-powered analysis with personalized
              recommendations.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="border-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                  <Camera className="w-5 h-5 text-pink-600" />
                  Upload Skin Image
                </CardTitle>
                <CardDescription>Take a clear, well-lit photo of the area you&apos;d like to analyze</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-pink-200 rounded-lg p-8 text-center bg-pink-50/50 hover:bg-pink-50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <Image
                        src={uploadedImage}
                        alt="Uploaded skin image"
                        width={400}
                        height={192}
                        className="max-w-full h-48 object-contain rounded-lg mx-auto"
                      />
                      <p className="text-sm text-gray-600">Image uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-pink-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">Upload Skin Image</p>
                        <p className="text-sm text-gray-500">Drag & drop or click to select (Max 5MB)</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {uploadedImage && (
                  <div className="mt-6 space-y-4">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg py-3"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Analyze Skin Condition
                        </>
                      )}
                    </Button>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-gray-600 text-center">
                          {progress < 100 ? "Processing your image..." : "Finalizing analysis..."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      <strong>Disclaimer:</strong> This analysis is for screening purposes only. Always consult a
                      dermatologist for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="border-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                  <Info className="w-5 h-5 text-pink-600" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  {analysisComplete ? "AI analysis completed" : "Results will appear here after analysis"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisComplete ? (
                  <div className="space-y-6">
                    {/* Condition Detection */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800">Detected Conditions</h3>
                      {conditions.length > 0 ? (
                        <div className="space-y-2">
                          {conditions.map((cond, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-3 ${
                                cond.confidence >= 70
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-yellow-50 border border-yellow-200"
                              } rounded-lg`}
                            >
                              <div className="flex items-center gap-2">
                                {cond.confidence >= 70 ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                )}
                                <span className="text-sm font-medium text-gray-800">{cond.name}</span>
                              </div>
                              <Badge
                                className={`${
                                  cond.confidence >= 70
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                } hover:bg-opacity-80`}
                              >
                                {cond.confidence}% Confidence
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No specific conditions detected</p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800">Recommendations</h3>
                      {recommendations.length > 0 ? (
                        <div className="space-y-2 text-sm text-gray-600">
                          {recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2"></div>
                              <p>{rec}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No specific recommendations provided</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Save Report
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share Results
                      </Button>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg"
                      asChild
                    >
                      <Link href="/book-appointment">Book Dermatologist Consultation</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isAnalyzing ? "Analyzing your image..." : "Upload an image to see analysis results"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tips Section */}
          <Card className="border-pink-100 mt-8">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Photography Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-1">Good Lighting</h3>
                  <p className="text-gray-600">Use natural light or bright indoor lighting</p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-1">Clear Focus</h3>
                  <p className="text-gray-600">Ensure the image is sharp and in focus</p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Info className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-1">Close Distance</h3>
                  <p className="text-gray-600">Take the photo close enough to see details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Floating Chansey AI Button */}
      <ChanseyFAB />
    </div>
  )
}