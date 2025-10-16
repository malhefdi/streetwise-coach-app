'use client';
import React from 'react';
import { Card } from 'primereact/card';

interface PageScaffoldProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageScaffold({ title, subtitle, children }: PageScaffoldProps) {
  return (
    <div className="p-4 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </header>

      <main>
        <Card className="shadow-md border border-gray-200 rounded-xl">
          {children || (
            <div className="text-gray-500 italic p-4">
              🚧 Content under construction. Add components here.
            </div>
          )}
        </Card>
      </main>

      <footer className="text-xs text-gray-400 mt-8 border-t pt-3">
        StreetWise Coach · Experimental Build · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
