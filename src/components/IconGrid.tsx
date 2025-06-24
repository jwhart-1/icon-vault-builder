
import React from 'react';
import { ExtractedIcon } from './SvgIconManager';
import { IconCard } from './IconCard';

interface IconGridProps {
  icons: ExtractedIcon[];
  onIconSaved: (icon: ExtractedIcon) => void;
  onIconDeleted: (iconId: string) => void;
  showMetadataForms: boolean;
  isLoading?: boolean;
}

export const IconGrid: React.FC<IconGridProps> = ({
  icons,
  onIconSaved,
  onIconDeleted,
  showMetadataForms,
  isLoading = false,
}) => {
  if (icons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No icons to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {icons.map((icon) => (
        <IconCard
          key={icon.id}
          icon={icon}
          onSave={onIconSaved}
          onDelete={onIconDeleted}
          showMetadataForm={showMetadataForms}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};
