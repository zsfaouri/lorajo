"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { LocaleCode } from "@/types/cms";

type Props = {
  locale: LocaleCode;
};

type FormState = {
  name: string;
  birthYear: string;
  postalAddress: string;
  mobile: string;
  email: string;
  website: string;
  profession: string;
  hobbies: string;
  relationToJabalLuweibdeh: string;
  applicationYear: string;
  recommendationOneName: string;
  recommendationTwoName: string;
  membershipType: "supporting" | "honorary" | "full";
};

const currentYear = String(new Date().getFullYear());

const initialState: FormState = {
  name: "",
  birthYear: "",
  postalAddress: "",
  mobile: "",
  email: "",
  website: "",
  profession: "",
  hobbies: "",
  relationToJabalLuweibdeh: "",
  applicationYear: currentYear,
  recommendationOneName: "",
  recommendationTwoName: "",
  membershipType: "full",
};

function updateField<K extends keyof FormState>(state: FormState, key: K, value: FormState[K]) {
  return { ...state, [key]: value };
}

export function JoinUsPage({ locale }: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const isArabic = locale === "ar";

  const membershipOptions = useMemo(
    () => [
      { value: "full" as const, label: "Full Member", ar: "عضو عامل" },
      { value: "honorary" as const, label: "Honorary Member", ar: "عضو شرف" },
      { value: "supporting" as const, label: "Supporting Member", ar: "عضو مؤازر" },
    ],
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const response = await fetch("/api/join-us", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error ?? "Submission failed.");
      return;
    }

    setStatus("sent");
    setMessage("Application received.");
    setForm(initialState);
  }

  return (
    <main className="lora-join" dir={isArabic ? "rtl" : "ltr"}>
      <section className="lora-join__hero">
        <p className="lora-merged-eyebrow">Join Us</p>
        <h1>Membership Application Form</h1>
        <p>طلب إنتساب</p>
      </section>

      <form className="lora-join__form" onSubmit={submit}>
        <section className="lora-join__panel">
          <div className="lora-join__section-head">
            <span>01</span>
            <div>
              <h2>Applicant details</h2>
              <p>بيانات طالب الإنتساب</p>
            </div>
          </div>

          <div className="lora-join__grid">
            <label>
              <span>Name / الاسم</span>
              <input required value={form.name} onChange={(event) => setForm(updateField(form, "name", event.target.value))} />
            </label>
            <label>
              <span>Date of Birth Year / سنة الميلاد</span>
              <input required inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="YYYY" value={form.birthYear} onChange={(event) => setForm(updateField(form, "birthYear", event.target.value.replace(/\D/g, "").slice(0, 4)))} />
            </label>
            <label className="lora-join__wide">
              <span>Postal Address / العنوان البريدي</span>
              <input required value={form.postalAddress} onChange={(event) => setForm(updateField(form, "postalAddress", event.target.value))} />
            </label>
            <label>
              <span>Mobile / الخلوي</span>
              <input required type="tel" value={form.mobile} onChange={(event) => setForm(updateField(form, "mobile", event.target.value))} />
            </label>
            <label>
              <span>Email / البريد الإلكتروني</span>
              <input required type="email" value={form.email} onChange={(event) => setForm(updateField(form, "email", event.target.value))} />
            </label>
            <label>
              <span>Website / الموقع الإلكتروني</span>
              <input value={form.website} onChange={(event) => setForm(updateField(form, "website", event.target.value))} />
            </label>
            <label>
              <span>Profession / المهنة</span>
              <input value={form.profession} onChange={(event) => setForm(updateField(form, "profession", event.target.value))} />
            </label>
            <label className="lora-join__wide">
              <span>Hobbies / النشاطات والهوايات</span>
              <textarea value={form.hobbies} onChange={(event) => setForm(updateField(form, "hobbies", event.target.value))} />
            </label>
            <label className="lora-join__wide">
              <span>Relation to Jabal Luweibdeh / ماهي علاقتك بجبل اللويبدة</span>
              <textarea required value={form.relationToJabalLuweibdeh} onChange={(event) => setForm(updateField(form, "relationToJabalLuweibdeh", event.target.value))} />
            </label>
            <label>
              <span>Application Year / سنة تقديم الطلب</span>
              <input required inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="YYYY" value={form.applicationYear} onChange={(event) => setForm(updateField(form, "applicationYear", event.target.value.replace(/\D/g, "").slice(0, 4)))} />
            </label>
          </div>
        </section>

        <section className="lora-join__panel">
          <div className="lora-join__section-head">
            <span>02</span>
            <div>
              <h2>Recommendations</h2>
              <p>تزكية عضوين من مجلس الإدارة</p>
            </div>
          </div>

          <div className="lora-join__grid">
            <label>
              <span>Recommendation 1 Name / الاسم</span>
              <input value={form.recommendationOneName} onChange={(event) => setForm(updateField(form, "recommendationOneName", event.target.value))} />
            </label>
            <label>
              <span>Recommendation 2 Name / الاسم</span>
              <input value={form.recommendationTwoName} onChange={(event) => setForm(updateField(form, "recommendationTwoName", event.target.value))} />
            </label>
          </div>
        </section>

        <section className="lora-join__panel">
          <div className="lora-join__section-head">
            <span>03</span>
            <div>
              <h2>Membership type</h2>
              <p>نوع العضوية</p>
            </div>
          </div>

          <div className="lora-join__choices">
            {membershipOptions.map((option) => (
              <label key={option.value}>
                <input type="radio" name="membershipType" value={option.value} checked={form.membershipType === option.value} onChange={() => setForm(updateField(form, "membershipType", option.value))} />
                <span>{option.label}</span>
                <em>{option.ar}</em>
              </label>
            ))}
          </div>
        </section>

        <div className="lora-join__submit">
          <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending..." : "Submit application"}</button>
          {message ? <p className={status === "error" ? "is-error" : ""}>{message}</p> : null}
        </div>
      </form>
    </main>
  );
}
