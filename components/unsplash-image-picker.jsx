"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";

export default function ImagePicker({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState("event");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { mutate: generateUploadUrl } = useConvexMutation(api.storage.generateUploadUrl);

  const searchImages = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=12&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      setImages(data.results || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchImages(query);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get upload URL from Convex
      const postUrl = await generateUploadUrl({});
      if (!postUrl) throw new Error("Failed to get upload URL");

      // 2. Post file to URL
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await response.json();

      // 3. Pass storageId back to form with local preview URL
      onSelect({ type: "upload", storageId, url: URL.createObjectURL(file) });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Cover Image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="unsplash" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
            <TabsTrigger value="upload">Upload Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="unsplash" className="flex-1 flex flex-col min-h-0">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images..."
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </form>

            <div className="overflow-y-auto flex-1 -mx-6 px-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 py-4">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => onSelect({ type: "unsplash", url: image.urls.regular })}
                      className="relative aspect-video overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 transition-all"
                    >
                      <Image
                        src={image.urls.small}
                        alt={image.description || "Unsplash image"}
                        className="w-full h-full object-cover"
                        width={400}
                        height={300}
                      />
                    </button>
                  ))}
                </div>
              )}

              {!loading && images.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  Search for images to get started
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Photos from{" "}
              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Unsplash
              </a>
            </p>
          </TabsContent>

          <TabsContent value="upload" className="flex-1">
            <div className="h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 bg-muted/20">
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p>Uploading image...</p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-purple-100 rounded-full">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Upload a custom image</p>
                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <Button variant="outline" className="relative">
                    Choose File
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileUpload}
                    />
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
