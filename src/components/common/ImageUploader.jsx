import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { adminApi } from "../../services/api";

export default function ImageUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const upload = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setStatus("Uploading...");
    try {
      const result = await adminApi.uploadImage(file);
      onChange({ image: result.data.url, imagePublicId: result.data.publicId, imageFormat: result.data.format });
      setStatus("Upload successful");
    } catch (uploadError) {
      setStatus("");
      setError(uploadError.message);
    }
  };

  const remove = () => {
    onChange({ image: "", imagePublicId: "", imageFormat: "" });
    setStatus("");
    setError("");
  };

  return <div className="image-uploader">
    <div className="image-uploader-head"><strong>Product image</strong><span>JPG, PNG or WEBP up to 5MB</span></div>
    {value ? <div className="image-preview"><img src={value} alt="Product preview" /><button type="button" className="icon danger" onClick={remove} aria-label="Remove product image"><X size={16} /></button></div> : null}
    <button type="button" className="image-upload-button" onClick={() => inputRef.current?.click()}><ImagePlus size={19} /> {value ? "Choose another photo" : "Choose photo from gallery"}</button>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden />
    {status && <small className="upload-status">{status}</small>}
    {status === "Uploading..." && <LoaderCircle className="upload-spinner" size={15} />}
    {error && <small className="error">{error}</small>}
  </div>;
}
