'use client';
import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { curricula } from '@/app/data/curriculumEngine';

type CurId = 'gc2' | 'bbs1';

export default function CurriculumSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const curId: CurId =
    (params.get('cur') as CurId) ||
    (typeof window !== 'undefined'
      ? ((localStorage.getItem('curId') as CurId) || 'gc2')
      : 'gc2');

  const curriculumMeta = [
    {
      id: 'gc2',
      name: 'Gracie Combatives 2.0',
      lessons: curricula.gc2.lessons.length,
    },
    {
      id: 'bbs1',
      name: 'Master Cycle — Blue Belt Stripe 1',
      lessons: curricula.bbs1.lessons.length,
    },
  ];

  const options = curriculumMeta.map((c) => ({
    label: `${c.name} (${c.lessons})`,
    value: c.id,
  }));

  const onChange = (e: any) => {
    const next = e.value as CurId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('curId', next);
    }
    router.push(`${pathname}?cur=${next}`);
  };

  return (
    <Dropdown
      value={curId}
      options={options}
      onChange={onChange}
      placeholder="Select Curriculum"
      className="p-dropdown-sm"
    />
  );
}
