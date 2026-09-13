import type { ComponentProps } from 'react';

import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Carousel from './Carousel';
import CarouselSlide from './CarouselSlide';

// jsdom does not implement scrollIntoView; the stub is kept in a
// variable so call assertions never dereference the method (Tour.test
// precedent).
const scrollIntoView = vi.fn();

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

/** 受控探针：暴露当前幻灯片索引。 */
function ProbeCarousel(props: Partial<ComponentProps<typeof Carousel>>) {
  const [current, , control] = useControl(undefined, 0);
  return (
    <>
      <Carousel value={control} {...props}>
        <CarouselSlide>A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
        <CarouselSlide>C</CarouselSlide>
      </Carousel>
      <output data-testid="slide">{current}</output>
    </>
  );
}

const regionOf = () =>
  screen.getByRole('region', { name: 'Carousel' });
const trackOf = () => regionOf().firstElementChild as HTMLElement;
const slideOf = () => screen.getByTestId('slide');

/** 轨道没有固有尺寸（jsdom 无布局）：按需注入矩形。 */
function mockWidth(el: HTMLElement, width: number) {
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 0,
      width,
      height: 0,
      toJSON: () => ({}),
    });
}

function pointerDrag(
  el: HTMLElement,
  from: number,
  to: number,
  pointerType = 'mouse'
) {
  fireEvent.pointerDown(el, {
    pointerId: 1,
    pointerType,
    button: 0,
    clientX: from,
  });
  fireEvent.pointerMove(el, {
    pointerId: 1,
    pointerType,
    clientX: (from + to) / 2,
  });
  fireEvent.pointerMove(el, { pointerId: 1, pointerType, clientX: to });
  fireEvent.pointerUp(el, { pointerId: 1, pointerType, clientX: to });
}

describe('Carousel', () => {
  it('renders with carousel role', () => {
    render(
      <Carousel>
        <CarouselSlide>Slide 1</CarouselSlide>
        <CarouselSlide>Slide 2</CarouselSlide>
      </Carousel>
    );
    expect(screen.getByRole('region', { name: 'Carousel' })).toBeInTheDocument();
  });

  it('renders slides', () => {
    render(
      <Carousel>
        <CarouselSlide>Slide 1</CarouselSlide>
        <CarouselSlide>Slide 2</CarouselSlide>
      </Carousel>
    );
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
  });

  it('renders navigation buttons for multiple slides', () => {
    render(
      <Carousel>
        <CarouselSlide>Slide 1</CarouselSlide>
        <CarouselSlide>Slide 2</CarouselSlide>
      </Carousel>
    );
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
  });

  it('does not render navigation for single slide', () => {
    render(
      <Carousel>
        <CarouselSlide>Only one</CarouselSlide>
      </Carousel>
    );
    expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
  });

  it('renders dot indicators', () => {
    render(
      <Carousel>
        <CarouselSlide>A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
        <CarouselSlide>C</CarouselSlide>
      </Carousel>
    );
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toBeInTheDocument();
  });

  it('navigates with next/prev buttons', async () => {
    const user = userEvent.setup();
    render(
      <Carousel>
        <CarouselSlide>A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
      </Carousel>
    );
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
  });

  it('navigates with dot indicators', async () => {
    const user = userEvent.setup();
    render(
      <Carousel>
        <CarouselSlide>A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
      </Carousel>
    );
    await user.click(screen.getByRole('button', { name: 'Go to slide 2' }));
  });

  it('steps slides with the region arrow keys and Home/End', async () => {
    const user = userEvent.setup();
    function KeyboardCarousel() {
      const [current, , control] = useControl(undefined, 0);
      return (
        <>
          <Carousel value={control}>
            <CarouselSlide>A</CarouselSlide>
            <CarouselSlide>B</CarouselSlide>
            <CarouselSlide>C</CarouselSlide>
          </Carousel>
          <output data-testid="slide">{current}</output>
        </>
      );
    }
    render(<KeyboardCarousel />);
    const region = screen.getByRole('region', { name: 'Carousel' });
    region.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('slide')).toHaveTextContent('1');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('slide')).toHaveTextContent('0');
    // Wraps in both directions.
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('slide')).toHaveTextContent('2');
    await user.keyboard('{End}');
    expect(screen.getByTestId('slide')).toHaveTextContent('2');
    await user.keyboard('{Home}');
    expect(screen.getByTestId('slide')).toHaveTextContent('0');
  });

  it('mirrors the arrow keys under dir="rtl"', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <ProbeCarousel />
      </div>
    );
    regionOf().focus();
    // In rtl ← is the advance key (mirrored slide order).
    await user.keyboard('{ArrowLeft}');
    expect(slideOf()).toHaveTextContent('1');
    await user.keyboard('{ArrowRight}');
    expect(slideOf()).toHaveTextContent('0');
  });

  it('applies className', () => {
    render(
      <Carousel className="custom">
        <CarouselSlide>A</CarouselSlide>
      </Carousel>
    );
    expect(screen.getByRole('region')).toHaveClass('custom');
  });

  it('auto-plays when enabled and wraps around', () => {
    vi.useFakeTimers();
    render(<ProbeCarousel autoPlay interval={1000} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slideOf()).toHaveTextContent('1');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slideOf()).toHaveTextContent('2');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slideOf()).toHaveTextContent('0'); // 循环
    vi.useRealTimers();
  });

  it('keeps playing on hover without pauseOnHover', () => {
    vi.useFakeTimers();
    render(<ProbeCarousel autoPlay interval={1000} />);
    fireEvent.pointerEnter(regionOf());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slideOf()).toHaveTextContent('1');
    vi.useRealTimers();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Carousel>
        <CarouselSlide>Slide 1</CarouselSlide>
        <CarouselSlide>Slide 2</CarouselSlide>
        <CarouselSlide>Slide 3</CarouselSlide>
      </Carousel>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations after navigating to the next slide', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Carousel>
        <CarouselSlide>Slide 1</CarouselSlide>
        <CarouselSlide>Slide 2</CarouselSlide>
      </Carousel>
    );
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Carousel pauseOnHover', () => {
  it('pauses on hover and resumes with the remaining budget', () => {
    vi.useFakeTimers();
    render(<ProbeCarousel autoPlay interval={1000} pauseOnHover />);
    act(() => {
      vi.advanceTimersByTime(400); // 计时进行中
    });
    fireEvent.pointerEnter(regionOf()); // 暂停：已入账 400，剩余 600
    act(() => {
      vi.advanceTimersByTime(500); // 暂停期间不走预算
    });
    expect(slideOf()).toHaveTextContent('0');
    fireEvent.pointerLeave(regionOf()); // 恢复：从剩余 600 继续
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(slideOf()).toHaveTextContent('0'); // 剩余预算尚未耗尽
    act(() => {
      vi.advanceTimersByTime(1);
    });
    // 恰好在剩余预算点推进——重置式实现要到 t=1900 才翻页
    expect(slideOf()).toHaveTextContent('1');
    vi.useRealTimers();
  });

  it('pauses while focus is within and resumes when it leaves', () => {
    vi.useFakeTimers();
    render(<ProbeCarousel autoPlay interval={1000} pauseOnHover />);
    const dot = screen.getByRole('button', { name: 'Go to slide 2' });
    const next = screen.getByRole('button', { name: 'Next slide' });
    fireEvent.focus(dot);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(slideOf()).toHaveTextContent('0'); // 焦点在内：暂停
    // 焦点在轮播内部移动（圆点→按钮）不算离开
    fireEvent.blur(dot, { relatedTarget: next });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(slideOf()).toHaveTextContent('0');
    fireEvent.blur(next, { relatedTarget: document.body }); // 焦点真正离开
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(slideOf()).toHaveTextContent('0');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(slideOf()).toHaveTextContent('1');
    vi.useRealTimers();
  });
});

describe('Carousel pointer drag', () => {
  it('follows the pointer by driving scrollLeft and pages past the threshold', () => {
    render(<ProbeCarousel />);
    const track = trackOf();
    mockWidth(track, 400); // 翻页阈值 = 100
    fireEvent.pointerDown(track, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 200,
    });
    fireEvent.pointerMove(track, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 150,
    });
    // 内容跟随：起点 scrollLeft 0 − 位移 −50 = 50（程序化驱动，非原生滚动）
    expect(track.scrollLeft).toBe(50);
    fireEvent.pointerMove(track, { pointerId: 1, pointerType: 'mouse', clientX: 60 });
    fireEvent.pointerUp(track, { pointerId: 1, pointerType: 'mouse', clientX: 60 });
    expect(slideOf()).toHaveTextContent('1'); // 左拖 140 > 阈值 → 下一页
    // 拖拽样式清理：不留 inline 痕迹
    expect(track.style.scrollBehavior).toBe('');
    expect(track.style.scrollSnapType).toBe('');
    expect(track.style.userSelect).toBe('');
  });

  it('pages to the previous slide when dragging right', () => {
    render(<ProbeCarousel />);
    const track = trackOf();
    mockWidth(track, 400);
    pointerDrag(track, 200, 380); // 右拖 180
    expect(slideOf()).toHaveTextContent('2'); // 0 的上一页循环到 2
  });

  it('snaps back when the drag stays below the threshold', () => {
    render(<ProbeCarousel />);
    const track = trackOf();
    mockWidth(track, 400);
    const spy = vi.spyOn(track.children[0] as HTMLElement, 'scrollIntoView');
    pointerDrag(track, 200, 160); // |−40| < 100
    expect(slideOf()).toHaveTextContent('0');
    expect(spy).toHaveBeenLastCalledWith({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  });

  it('leaves touch scrolling to the native scroller in slide mode', () => {
    render(<ProbeCarousel />);
    const track = trackOf();
    const down = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: 200,
    });
    track.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(false); // 不破坏原生 scroll-snap
    fireEvent.pointerMove(track, { pointerId: 1, pointerType: 'touch', clientX: 50 });
    fireEvent.pointerUp(track, { pointerId: 1, pointerType: 'touch', clientX: 50 });
    expect(track.scrollLeft).toBe(0); // 未代管 scrollLeft
    expect(slideOf()).toHaveTextContent('0'); // 未翻页
    expect(track.style.userSelect).toBe(''); // 未接管手势
  });

  it('mirrors the drag paging direction under dir="rtl"', () => {
    render(
      <div dir="rtl">
        <ProbeCarousel />
      </div>
    );
    const track = trackOf();
    mockWidth(track, 400);
    pointerDrag(track, 200, 380); // 右拖在 RTL 是下一页（行进侧镜像）
    expect(slideOf()).toHaveTextContent('1');
  });

  it('swallows the click that follows a paging drag', () => {
    const onClick = vi.fn();
    render(
      <Carousel>
        <CarouselSlide>
          <button type="button" onClick={onClick}>
            Inner
          </button>
        </CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
      </Carousel>
    );
    const track = trackOf();
    mockWidth(track, 400);
    pointerDrag(track, 200, 380);
    fireEvent.click(screen.getByRole('button', { name: 'Inner' }));
    expect(onClick).not.toHaveBeenCalled();
    // 非拖拽的普通点击不受影响
    fireEvent.click(screen.getByRole('button', { name: 'Inner' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks native drag of slide content during a drag session', () => {
    render(<ProbeCarousel />);
    const track = trackOf();
    fireEvent.pointerDown(track, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 200,
    });
    fireEvent.pointerMove(track, { pointerId: 1, pointerType: 'mouse', clientX: 100 });
    const dragStart = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    });
    track.dispatchEvent(dragStart);
    expect(dragStart.defaultPrevented).toBe(true);
    fireEvent.pointerUp(track, { pointerId: 1, pointerType: 'mouse', clientX: 100 });
  });

  it('pauses autoPlay for the whole press session and resumes with the budget', () => {
    vi.useFakeTimers();
    render(<ProbeCarousel autoPlay interval={1000} />);
    const track = trackOf();
    mockWidth(track, 400);
    fireEvent.pointerDown(track, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 200,
    });
    act(() => {
      vi.advanceTimersByTime(2000); // 按压期间暂停
    });
    expect(slideOf()).toHaveTextContent('0');
    fireEvent.pointerUp(track, { pointerId: 1, pointerType: 'mouse', clientX: 205 });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(slideOf()).toHaveTextContent('0');
    act(() => {
      vi.advanceTimersByTime(1); // 释放后按剩余预算推进
    });
    expect(slideOf()).toHaveTextContent('1');
    vi.useRealTimers();
  });
});

describe('Carousel fade effect', () => {
  const fadeSlides = () => screen.getAllByRole('group', { hidden: true });

  it('stacks slides and marks only the active one', () => {
    render(<ProbeCarousel effect="fade" />);
    const slides = fadeSlides();
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAttribute('data-active');
    expect(slides[0]).not.toHaveAttribute('inert');
    expect(slides[1]).toHaveAttribute('inert'); // 非激活页不可交互/不可聚焦
    expect(slides[1]).not.toHaveAttribute('data-active');
  });

  it('switches by value without going through the scroll API', async () => {
    const user = userEvent.setup();
    render(<ProbeCarousel effect="fade" />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    const slides = fadeSlides();
    expect(slides[1]).toHaveAttribute('data-active');
    expect(slides[0]).toHaveAttribute('inert');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('wraps around', async () => {
    const user = userEvent.setup();
    render(<ProbeCarousel effect="fade" />);
    await user.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(slideOf()).toHaveTextContent('0');
    expect(fadeSlides()[0]).toHaveAttribute('data-active');
  });

  it('steps with the region arrow keys', async () => {
    const user = userEvent.setup();
    render(<ProbeCarousel effect="fade" />);
    regionOf().focus();
    await user.keyboard('{ArrowRight}');
    expect(slideOf()).toHaveTextContent('1');
    await user.keyboard('{Home}');
    expect(slideOf()).toHaveTextContent('0');
  });

  it('pages by drag, touch included (no native scroller to protect)', () => {
    render(<ProbeCarousel effect="fade" />);
    const track = trackOf();
    mockWidth(track, 400);
    pointerDrag(track, 200, 20, 'mouse'); // 左拖 180 → 下一页
    expect(slideOf()).toHaveTextContent('1');
    pointerDrag(track, 200, 20, 'touch');
    expect(slideOf()).toHaveTextContent('2');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Carousel effect="fade">
        <CarouselSlide>Slide 1</CarouselSlide>
        <CarouselSlide>Slide 2</CarouselSlide>
        <CarouselSlide>Slide 3</CarouselSlide>
      </Carousel>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Carousel default-form regression guard', () => {
  it('renders no trace of the new props when they are omitted', () => {
    render(<ProbeCarousel />);
    const track = trackOf();
    // 轨道仍是单个 Linaria 类，无 inline 样式
    expect(track.className.trim().split(/\s+/)).toHaveLength(1);
    expect(track.getAttribute('style')).toBeNull();
    const slides = screen.getAllByRole('group');
    for (const slide of slides) {
      expect(slide).not.toHaveAttribute('inert');
      expect(slide).not.toHaveAttribute('data-active');
    }
  });

  it('treats an explicit slide effect as the default', () => {
    const { rerender } = render(<ProbeCarousel />);
    const track = trackOf();
    const defaultClass = track.className;
    rerender(<ProbeCarousel effect="slide" />);
    expect(track.className).toBe(defaultClass);
  });
});

describe('CarouselSlide', () => {
  it('renders children with slide role', () => {
    render(
      <Carousel>
        <CarouselSlide>Content</CarouselSlide>
        <CarouselSlide>Content 2</CarouselSlide>
      </Carousel>
    );
    const slides = screen.getAllByRole('group');
    expect(slides).toHaveLength(2);
  });

  it('applies className', () => {
    render(
      <Carousel>
        <CarouselSlide className="custom">A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
      </Carousel>
    );
    expect(screen.getAllByRole('group')[0]).toHaveClass('custom');
  });
});
