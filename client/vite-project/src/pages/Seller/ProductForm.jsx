import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiFileText, FiImage, FiSave } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import DynamicProductFields from "../../components/seller/DynamicProductFields";
import { getCategories, getCategoryFields } from "../../services/categoryService";
import { createProduct, getSellerProduct, updateProduct } from "../../services/productService";
import { apiMessage } from "../../lib/api";
import { getCompanies } from "../../services/companyService";
import { useToast } from "../../context/ToastContext";

const empty = { categoryId: "", companyId: "", productName: "", brand: "", description: "", availability: "in_stock", status: "active", attributes: {} };
const MAX_IMAGE_BYTES = 200 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function imageError(file) {
  if (!file) return "Product image is required.";
  if (!IMAGE_TYPES.has(file.type)) return "Choose a PNG, JPEG, or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Product image must be 200 KB or smaller.";
  return "";
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

export default function ProductForm() {
  const { id } = useParams(), editing = Boolean(id), navigate = useNavigate(), { toast } = useToast();
  const [categories, setCategories] = useState([]), [companies, setCompanies] = useState([]), [fields, setFields] = useState([]), [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({}), [loading, setLoading] = useState(editing), [saving, setSaving] = useState(false);
  const [image, setImage] = useState(""), [imageName, setImageName] = useState(""), [existingImage, setExistingImage] = useState("");
  const [documentName, setDocumentName] = useState("");

  useEffect(() => { getCategories().then(({ data }) => setCategories(data.data)).catch((error) => toast(apiMessage(error), "error")); }, [toast]);
  useEffect(() => { getCompanies().then(({ data }) => setCompanies(data.data)).catch((error) => toast(apiMessage(error), "error")); }, [toast]);
  const loadFields = useCallback(async (categoryId) => { if (!categoryId) { setFields([]); return []; } const { data } = await getCategoryFields(categoryId); setFields(data.data); return data.data; }, []);
  useEffect(() => {
    if (!editing) return;
    getSellerProduct(id).then(async ({ data }) => {
      const product = data.product;
      await loadFields(product.categoryId);
      setForm({ categoryId: String(product.categoryId), companyId: String(product.companyId || ""), productName: product.productName, brand: product.brand, description: product.description, availability: product.availability || "in_stock", status: product.status, attributes: product.attributes || {} });
      setExistingImage(product.images?.[0]?.imageUrl || product.imageUrl || "");
    }).catch((error) => toast(apiMessage(error), "error")).finally(() => setLoading(false));
  }, [editing, id, loadFields, toast]);

  const selectCategory = async (value) => { setForm((current) => ({ ...current, categoryId: value, attributes: {} })); setErrors({}); try { await loadFields(value); } catch (error) { toast(apiMessage(error), "error"); } };
  const selectImage = async (file) => {
    const error = imageError(file);
    setErrors((current) => ({ ...current, image: error }));
    setImage(""); setImageName(file?.name || "");
    if (error) return;
    try { setImage(await readImage(file)); } catch (readError) { setErrors((current) => ({ ...current, image: readError.message })); }
  };
  const validate = () => {
    const next = {};
    if (!form.categoryId) next.categoryId = "Category is required.";
    if (form.productName.trim().length < 2) next.productName = "Enter at least 2 characters.";
    if (!form.companyId) next.companyId = "Select a brand/company.";
    if (form.description.trim().length < 10) next.description = "Description must contain at least 10 characters.";
    if (!editing && !image) next.image = "Product image is required.";
    const attributes = {};
    for (const field of fields) {
      const value = form.attributes[field.fieldKey];
      if (field.required && (value === undefined || value === null || String(value).trim() === "")) attributes[field.fieldKey] = `${field.fieldLabel} is required.`;
      else if (field.fieldType === "number" && value !== "" && !Number.isFinite(Number(value))) attributes[field.fieldKey] = `${field.fieldLabel} must be a number.`;
    }
    next.attributes = attributes; setErrors(next);
    return !next.categoryId && !next.companyId && !next.productName && !next.description && !next.image && !Object.keys(attributes).length;
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return toast("Please correct the highlighted fields.", "error");
    setSaving(true);
    try {
      const payload = { ...form, categoryId: Number(form.categoryId), companyId: Number(form.companyId), productName: form.productName.trim(), description: form.description.trim(), ...(image ? { image } : {}) };
      if (editing) await updateProduct(id, payload); else await createProduct(payload);
      toast(`Product ${editing ? "updated" : "created"} successfully.`); navigate("/seller/products", { replace: true });
    } catch (error) { toast(apiMessage(error), "error"); } finally { setSaving(false); }
  };
  const change = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: key === "description" && value.trim().length < 10 ? "Description must contain at least 10 characters." : value.trim().length < 2 ? "Enter at least 2 characters." : "" })); };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
  return <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center gap-4"><Link to="/seller/products" className="grid size-10 place-items-center rounded-xl border bg-white"><FiArrowLeft /></Link><div><h1 className="text-3xl font-black">{editing ? "Edit Product" : "Add Product"}</h1><p className="text-sm text-slate-500">Select a category to load its required product fields.</p></div></div>
    <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Basic Information</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Category" error={errors.categoryId}><select value={form.categoryId} onChange={(event) => selectCategory(event.target.value)} className="input"><option value="">Select Category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
      <Field label="Product Name" error={errors.productName}><input value={form.productName} onChange={(event) => change("productName", event.target.value)} className="input" /></Field>
      <Field label="Brand / Company" error={errors.companyId}><select value={form.companyId} onChange={(event) => { const company=companies.find(item=>String(item.id)===event.target.value); setForm(current=>({...current,companyId:event.target.value,brand:company?.companyName||""})); setErrors(current=>({...current,companyId:""})); }} className="input"><option value="">Select Brand / Company</option>{companies.map(company=><option key={company.id} value={company.id}>{company.companyName}</option>)}</select></Field>
      <Field label="Stock Availability"><select value={form.availability} onChange={(event) => setForm(current=>({...current,availability:event.target.value}))} className="input"><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></select></Field>
      {editing && <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="input"><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option></select></Field>}
      <div className="sm:col-span-2"><Field label="Product Description" error={errors.description}><textarea rows="5" value={form.description} onChange={(event) => change("description", event.target.value)} className="input" /></Field></div>
    </div></section>
    <DynamicProductFields fields={fields} values={form.attributes} errors={errors.attributes} onChange={(key, value) => { setForm((current) => ({ ...current, attributes: { ...current.attributes, [key]: value } })); setErrors((current) => ({ ...current, attributes: { ...current.attributes, [key]: "" } })); }} />
    <section className="grid gap-5 sm:grid-cols-2">
      <label className={`rounded-2xl border border-dashed bg-white p-6 text-center ${errors.image ? "border-red-400" : "border-slate-300"}`}><FiImage className="mx-auto text-3xl text-slate-400" /><b className="mt-2 block">Product Image <span className="text-red-600">*</span></b><p className="mt-1 text-xs text-slate-500">Required · PNG, JPEG or WebP · maximum 200 KB</p>{(image || existingImage) && <img src={image || existingImage} alt="Product preview" className="mx-auto mt-3 h-28 w-full rounded-xl object-cover" />}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectImage(event.target.files?.[0])} className="mt-3 text-xs" />{imageName && !errors.image && <p className="mt-2 text-xs text-teal-700">{imageName}</p>}{errors.image && <p className="mt-2 text-xs text-red-600">{errors.image}</p>}</label>
      <Upload icon={FiFileText} title="Datasheet" name={documentName} accept=".pdf" onChange={setDocumentName} />
    </section>
    <div className="flex justify-end"><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 font-bold text-white disabled:opacity-50"><FiSave />{saving ? "Saving..." : "Save Product"}</button></div>
  </form>;
}

function Field({ label, error, children }) { return <label className="block text-sm font-bold text-slate-700">{label}{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }
function Upload({ icon: Icon, title, name, accept, onChange }) { return <label className="rounded-2xl border border-dashed bg-white p-6 text-center"><Icon className="mx-auto text-3xl text-slate-400" /><b className="mt-2 block">{title}</b><p className="mt-1 text-xs text-slate-400">Optional</p><input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0]?.name || "")} className="mt-3 text-xs" />{name && <p className="mt-2 text-xs text-teal-700">{name}</p>}</label>; }
