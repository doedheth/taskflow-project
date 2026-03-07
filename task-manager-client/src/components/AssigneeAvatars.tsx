import { Assignee } from '../types';

interface Props {
  assignees: Assignee[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showNames?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-6 h-6 text-xs',
  lg: 'w-8 h-8 text-sm',
};

const overlapClasses = {
  sm: '-ml-1.5',
  md: '-ml-2',
  lg: '-ml-2.5',
};

export default function AssigneeAvatars({ 
  assignees, 
  maxDisplay = 3, 
  size = 'md',
  showNames = false 
}: Props) {
  if (!assignees || assignees.length === 0) {
    return (
      <span className="text-dark-400 text-xs">Unassigned</span>
    );
  }

  const displayedAssignees = assignees.slice(0, maxDisplay);
  const remainingCount = assignees.length - maxDisplay;

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {displayedAssignees.map((assignee, index) => (
          <div
            key={assignee.id}
            className={`${sizeClasses[size]} rounded-full border-2 border-dark-800 flex items-center justify-center ${
              index > 0 ? overlapClasses[size] : ''
            }`}
            title={assignee.name}
          >
            {assignee.avatar ? (
              <img
                src={assignee.avatar}
                alt={assignee.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-medium">
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={`${sizeClasses[size]} ${overlapClasses[size]} rounded-full border-2 border-dark-800 bg-dark-700 flex items-center justify-center text-white font-medium`}
            title={`+${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      {showNames && assignees.length <= 2 && (
        <span className="ml-2 text-xs text-dark-300 truncate max-w-[100px]">
          {assignees.map(a => a.name.split(' ')[0]).join(', ')}
        </span>
      )}
    </div>
  );
}

