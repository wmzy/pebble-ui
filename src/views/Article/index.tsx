import type {Article} from '@/types';

import {useData} from '@native-router/react';

import CommentList from './CommentList';

export default function ArticleView() {
  const article = useData() as Article;

  return (
    <div>
      <h1>{article.title}</h1>
      <div>
        {article.body.split('\\n').map((p, i) => (
           
          <p key={i}>{p}</p>
        ))}
      </div>
      <CommentList title={article.slug} />
    </div>
  );
}
