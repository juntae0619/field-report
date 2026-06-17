import Link from "next/link";
import { type Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="auction_no">경공매 물건번호</Label>
        <Input
          id="auction_no"
          name="auction_no"
          defaultValue={property?.auction_no ?? ""}
          placeholder="예) 2025타경34571"
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
          placeholder="상세 주소"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">메모</Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          defaultValue={property?.note ?? ""}
          placeholder="세대수, 특이사항 등"
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
