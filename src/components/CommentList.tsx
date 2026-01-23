interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string };
}

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-200 dark:border-gray-700"
        >
          <p className="mb-1">{comment.content}</p>
          <span className="text-xs text-gray-400">
            – {comment.author.name},{" "}
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

