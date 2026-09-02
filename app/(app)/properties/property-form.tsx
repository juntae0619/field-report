import Link from "next/link";
import {
  DEAL_TYPE_LABEL,
  PROPERTY_STATUS_LABEL,
  type DealType,
  type Property,
  type PropertyStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

export function PropertyForm({
  action,
  property,
  error,
}: {
  action: (formData: FormData) => void;
  property?: Property;
  error?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">물건명 / 단지명</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={property?.name}
          placeholder="예) 헬리오시티"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>검토 상태</Label>
          <Select name="status" defaultValue={property?.status ?? "candidate"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(PROPERTY_STATUS_LABEL) as [PropertyStatus, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>거래 유형</Label>
          <Select name="deal_type" defaultValue={property?.deal_type ?? "none"}>
            <SelectTrigger><SelectValue placeholder="미정" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">미정</SelectItem>
              {(Object.entries(DEAL_TYPE_LABEL) as [DealType, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="auction_no">경공매 사건번호 / 물건번호</Label>
        <Input
          id="auction_no"
          name="auction_no"
          defaultValue={property?.auction_no ?? ""}
          placeholder="예) 2025타경34571 또는 2026-12345-001"
          maxLength={100}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="property_type">유형</Label>
          <Input
            id="property_type"
            name="property_type"
            defaultValue={property?.property_type ?? ""}
            placeholder="예) 아파트/오피스텔/창고/공장/상가"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="region">지역</Label>
          <Input
            id="region"
            name="region"
            defaultValue={property?.region ?? ""}
            placeholder="예) 서울 송파"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">주소</Label>
        <Input
          id="address"
          name="address"
          defaultValue={property?.address ?? ""}
          placeholder="도로명 또는 지번 주소"
          maxLength={300}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="asking_price_manwon">매매가·보증금·최저가 (만원)</Label>
          <Input id="asking_price_manwon" name="asking_price_manwon" type="number" min="0" step="1" defaultValue={property?.asking_price_manwon ?? ""} placeholder="예) 85000" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="monthly_rent_manwon">월세 (만원)</Label>
          <Input id="monthly_rent_manwon" name="monthly_rent_manwon" type="number" min="0" step="1" defaultValue={property?.monthly_rent_manwon ?? ""} placeholder="예) 120" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="maintenance_fee_manwon">관리비 (만원)</Label>
          <Input id="maintenance_fee_manwon" name="maintenance_fee_manwon" type="number" min="0" step="0.1" defaultValue={property?.maintenance_fee_manwon ?? ""} placeholder="예) 18.5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="exclusive_area_m2">전용면적 (㎡)</Label>
          <Input id="exclusive_area_m2" name="exclusive_area_m2" type="number" min="0.01" step="0.01" defaultValue={property?.exclusive_area_m2 ?? ""} placeholder="예) 84.97" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="building_year">준공연도</Label>
          <Input id="building_year" name="building_year" type="number" min="1800" max="2100" step="1" defaultValue={property?.building_year ?? ""} placeholder="예) 2018" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="households">세대수</Label>
          <Input id="households" name="households" type="number" min="0" step="1" defaultValue={property?.households ?? ""} placeholder="예) 9510" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="source_url">매물·경공매 원문 링크</Label>
        <Input id="source_url" name="source_url" type="url" defaultValue={property?.source_url ?? ""} placeholder="https://" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">사전 조사·현장 체크 메모</Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          defaultValue={property?.note ?? ""}
          placeholder="교통, 상권, 학군, 소음, 주차, 공실, 건물 상태, 확인할 질문 등을 적어주세요."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <SubmitButton>{property ? "수정 저장" : "희망 물건 등록"}</SubmitButton>
        <Button type="button" variant="outline" asChild>
          <Link href={property ? `/properties/${property.id}` : "/properties"}>
            취소
          </Link>
        </Button>
      </div>
    </form>
  );
}
