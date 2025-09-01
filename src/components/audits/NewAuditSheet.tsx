"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseServices } from "@/lib/firebase-client";
import { ref, uploadBytes } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewAuditSheet() {
  const { user } = useAuth();
  const { storage } = getFirebaseServices();

  const [university, setUniversity] = useState("");
  const [domain, setDomain] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The button is disabled if the user is not logged in.
  const isDisabled = !user || isUploading;

  const handleUpload = async () => {
    if (!file || !university || !domain) {
      setError("Please fill all fields and select a file.");
      return;
    }
    // This check is redundant if the button is disabled, but it's good practice.
    if (!user) {
      setError("You must be logged in to upload a file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create a unique file path including the user's ID
      const filePath = `uploads/${user.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);

      // Upload the file with metadata
      await uploadBytes(storageRef, file, {
        customMetadata: {
          university,
          domain,
          userId: user.uid,
        },
      });
      
      alert("File uploaded successfully! It will now be processed.");
      // Reset form and close the sheet
      setFile(null);
      setUniversity("");
      setDomain("");
      // Ideally, you would have a state setter passed in to close the sheet
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please check the console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>New Audit</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Upload New Call for Auditing</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="university" className="text-right">
              University
            </Label>
            <Select value={university} onValueChange={setUniversity} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUA">CUA</SelectItem>
                <SelectItem value="RIT">RIT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="domain" className="text-right">
              Domain
            </Label>
            <Select value={domain} onValueChange={setDomain} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Reach">Reach</SelectItem>
                <SelectItem value="Connect">Connect</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="audio-file" className="text-right">
              Audio File
            </Label>
            <Input
              id="audio-file"
              type="file"
              className="col-span-3"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              accept="audio/*"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-4 text-center">{error}</p>}
        </div>
        <SheetFooter>
            <Button
              type="submit"
              onClick={handleUpload}
              disabled={isDisabled}
            >
              {isUploading ? "Uploading..." : "Upload and Start Audit"}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
