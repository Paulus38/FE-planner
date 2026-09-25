'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BookMarked, Plus, Pencil, Trash2, BookOpen, Eye, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { Book } from '@/lib/types';

export default function BooksPage() {
  const { loading, refresh } = useAppData();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<'all' | 'reading' | 'completed' | 'paused'>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState({
    title: '',
    author: '',
    total_pages: 100,
    current_page: 0,
    daily_goal_pages: 10,
    start_date: new Date().toISOString().split('T')[0],
    target_date: '',
    note: '',
  });

  const loadBooks = useCallback(async () => {
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Không thể tải sách.');
      return;
    }
    setBooks(data || []);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  function openAdd() {
    setEditingBook(null);
    setForm({
      title: '',
      author: '',
      total_pages: 100,
      current_page: 0,
      daily_goal_pages: 10,
      start_date: new Date().toISOString().split('T')[0],
      target_date: '',
      note: '',
    });
    setDialogOpen(true);
  }

  function openEdit(book: Book) {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author || '',
      total_pages: book.total_pages,
      current_page: book.current_page,
      daily_goal_pages: book.daily_goal_pages,
      start_date: book.start_date || '',
      target_date: book.target_date || '',
      note: book.note || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tên sách.');
      return;
    }

    const data = {
      title: form.title.trim(),
      author: form.author.trim() || null,
      total_pages: form.total_pages,
      current_page: form.current_page,
      daily_goal_pages: form.daily_goal_pages,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      note: form.note.trim() || null,
      status: form.current_page >= form.total_pages ? 'completed' : 'reading',
      updated_at: new Date().toISOString(),
    };

    if (editingBook) {
      const { error } = await supabase.from('books').update(data).eq('id', editingBook.id);
      if (error) { toast.error('Không thể cập nhật.'); return; }
      toast.success('Đã cập nhật sách.');
    } else {
      const { error } = await supabase.from('books').insert(data);
      if (error) { toast.error('Không thể thêm sách.'); return; }
      toast.success('Đã thêm sách.');
    }

    setDialogOpen(false);
    loadBooks();
    refresh();
  }

  async function updatePage(book: Book, newPage: number) {
    const clamped = Math.max(0, Math.min(newPage, book.total_pages));
    const { error } = await supabase.from('books')
      .update({
        current_page: clamped,
        status: clamped >= book.total_pages ? 'completed' : 'reading',
        updated_at: new Date().toISOString(),
      })
      .eq('id', book.id);
    if (error) { toast.error('Không thể cập nhật.'); return; }
    toast.success('Đã cập nhật trang.');
    loadBooks();
    refresh();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) { toast.error('Không thể xóa.'); return; }
    toast.success('Đã xóa sách.');
    loadBooks();
    refresh();
  }

  const filteredBooks = books.filter((book) => filter === 'all' || book.status === filter);
  const completedBooks = books.filter((book) => book.status === 'completed');
  const totalPagesRead = books.reduce((sum, book) => sum + book.current_page, 0);

  function formatDate(value?: string | null) {
    if (!value) return 'Chưa cập nhật';
    return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value.slice(0, 10)}T00:00:00`));
  }

  function statusLabel(status: Book['status']) {
    return status === 'completed' ? 'Đã đọc xong' : status === 'paused' ? 'Tạm dừng' : 'Đang đọc';
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-violet-500" />
            Đọc sách
          </h1>
          <p className="mt-1 text-muted-foreground">Theo dõi tiến độ đọc</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Thêm sách
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Tổng số sách</p>
            <p className="mt-1 text-2xl font-bold">{books.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Đã đọc xong</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{completedBooks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Tổng trang đã đọc</p>
            <p className="mt-1 text-2xl font-bold text-violet-600">{totalPagesRead.toLocaleString('vi-VN')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'Tất cả'],
          ['reading', 'Đang đọc'],
          ['completed', 'Đã đọc xong'],
          ['paused', 'Tạm dừng'],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? 'default' : 'outline'}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredBooks.map((book) => {
          const pct = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0;
          const remaining = book.total_pages - book.current_page;
          const daysToFinish = book.daily_goal_pages > 0 ? Math.ceil(remaining / book.daily_goal_pages) : 0;

          return (
            <Card key={book.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="rounded-lg bg-violet-500/10 p-2">
                      <BookOpen className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button className="text-left font-semibold truncate hover:text-primary" onClick={() => setSelectedBook(book)}>
                        {book.title}
                      </button>
                      {book.author && <p className="text-sm text-muted-foreground">{book.author}</p>}
                      <Badge variant="outline" className="mt-1">{statusLabel(book.status)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedBook(book)} title="Xem thông tin">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(book)} title="Chỉnh sửa">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(book.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Trang {book.current_page} / {book.total_pages}
                    </span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Mục tiêu: {book.daily_goal_pages} trang/ngày</span>
                    {remaining > 0 ? (
                      <span>Còn {remaining} trang (~{daysToFinish} ngày)</span>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 border-0">Hoàn thành</Badge>
                    )}
                  </div>

                  {remaining > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => updatePage(book, book.current_page - book.daily_goal_pages)}>
                        -{book.daily_goal_pages}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updatePage(book, book.current_page + 1)}>
                        +1
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updatePage(book, book.current_page + book.daily_goal_pages)}>
                        +{book.daily_goal_pages}
                      </Button>
                    </div>
                  )}
                </div>

                {book.note && <p className="mt-3 text-xs text-muted-foreground">{book.note}</p>}
              </CardContent>
            </Card>
          );
        })}

        {filteredBooks.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <BookMarked className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {books.length === 0 ? 'Chưa có sách nào. Hãy thêm sách để bắt đầu theo dõi.' : 'Không có sách trong bộ lọc này.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử sách đã đọc</CardTitle>
        </CardHeader>
        <CardContent>
          {completedBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Khi bạn đọc hết một cuốn, sách sẽ xuất hiện tại đây.</p>
          ) : (
            <div className="space-y-3">
              {completedBooks.map((book) => (
                <button key={book.id} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50" onClick={() => setSelectedBook(book)}>
                  <span>
                    <span className="block font-medium">{book.title}</span>
                    <span className="text-xs text-muted-foreground">{book.author || 'Chưa có tác giả'} · {book.total_pages} trang</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(book.updated_at)}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{statusLabel(selectedBook.status)}</Badge>
                <span className="text-sm text-muted-foreground">{selectedBook.author || 'Chưa có tác giả'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Tiến độ</p><p className="font-medium">{selectedBook.current_page}/{selectedBook.total_pages} trang</p></div>
                <div><p className="text-muted-foreground">Mục tiêu mỗi ngày</p><p className="font-medium">{selectedBook.daily_goal_pages} trang</p></div>
                <div><p className="text-muted-foreground">Ngày bắt đầu</p><p className="font-medium">{formatDate(selectedBook.start_date)}</p></div>
                <div><p className="text-muted-foreground">Dự kiến hoàn thành</p><p className="font-medium">{formatDate(selectedBook.target_date)}</p></div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" /> Cập nhật lần cuối: {formatDate(selectedBook.updated_at)}
              </div>
              {selectedBook.note ? (
                <div className="rounded-lg bg-muted p-3 text-sm"><p className="font-medium">Ghi chú</p><p className="mt-1 whitespace-pre-wrap">{selectedBook.note}</p></div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có ghi chú cho cuốn sách này.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBook ? 'Sửa sách' : 'Thêm sách'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên sách</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tác giả</Label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tổng số trang</Label>
                <Input type="number" value={form.total_pages} onChange={(e) => setForm({ ...form, total_pages: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Trang hiện tại</Label>
                <Input type="number" value={form.current_page} onChange={(e) => setForm({ ...form, current_page: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mục tiêu trang/ngày</Label>
                <Input type="number" value={form.daily_goal_pages} onChange={(e) => setForm({ ...form, daily_goal_pages: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Ngày dự kiến hoàn thành</Label>
                <Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editingBook ? 'Lưu' : 'Thêm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
