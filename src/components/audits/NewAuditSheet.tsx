"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseServices } from "@/lib/firebase-client";
import { ref, uploadBytes } from "firebase/storage";
import { collection, addDoc, doc, updateDoc, getFirestore } from "firebase/firestore";
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
  const db = getFirestore();

  const [university, setUniversity] = useState("");
  const [domain, setDomain] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = !user || isUploading;

  const handleUpload = async () => {
    if (!file || !university || !domain) {
      console.error("handleUpload: Missing file, university, or domain.");
      setError("Please fill all fields and select a file.");
      return;
    }
    if (!user) {
      console.error("handleUpload: User not logged in.");
      setError("You must be logged in to upload a file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    let auditRef;
    let auditId = "";

    try {
      auditRef = await addDoc(collection(db, "audits"), {
        userId: user.uid,
        university,
        domain,
        fileName: file.name,
        status: "Uploading",
        createdAt: new Date(),
      });

      auditId = auditRef.id;
      console.log("Firestore document created with auditId (document ID):", auditId);

      const filePath = `uploads/${user.uid}/${auditId}-${file.name}`;
      const storageRef = ref(storage, filePath);

      console.log("Client attempting to upload to fullPath:", storageRef.fullPath);

      const customMetadata = {
          university,
          domain,
          userId: user.uid,
      };
      console.log("Starting file upload with custom metadata:", customMetadata);
      await uploadBytes(storageRef, file, { customMetadata: customMetadata });
      console.log("File uploaded successfully with metadata.");
      
      alert(`File uploaded successfully! Audit ID: ${auditId}. It will now be processed.`);
      setFile(null);
      setUniversity("");
      setDomain("");
    } catch (err) {
      console.error("Upload process failed:", err);
      setError("Upload failed. Please check the console for details.");
      if (auditRef) {
        try {
          await updateDoc(auditRef, {
            status: "Upload Failed",
            errorMessage: (err as Error).message,
          });
          console.log("Audit document updated to 'Upload Failed'.");
        } catch (dbErr) {
          console.error("Failed to update audit document status to 'Upload Failed':", dbErr);
        }
      }
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
              onChange={(e) => {
                const selectedFile = e.target.files ? e.target.files[0] : null;
                setFile(selectedFile);
                console.log("File input onChange triggered. Selected file:", selectedFile ? selectedFile.name : "No file");
              }}
              accept="audio/*"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-4 text-center">{error}</p>}
        </div>
        <SheetFooter>
            <Button
              type="button" // Changed from "submit" to "button"
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
