import { expect, test, type Page, type WebSocketRoute } from '@playwright/test';
const frame = {
  type: 'compare',
  snapshot: [2, 1],
  payload: { indices: [0, 1] },
  message: 'A streamed comparison',
  line: 1,
};
async function open(page: Page, path = '/pathfinding') {
  await page.goto(path);
  await expect(page.getByLabel('Algorithm', { exact: true })).toBeVisible();
}
async function graph(page: Page) {
  await open(page);
  await page.getByRole('button', { name: 'Graph View', exact: true }).click();
}
async function fast(page: Page) {
  const slider = page.getByRole('slider', { name: 'Playback speed' });
  await expect(slider).toBeEnabled();
  await slider.focus();
  await slider.press('End');
}
async function weight(
  page: Page,
  source: string,
  target: string,
  value: number,
) {
  page.once('dialog', (dialog) => void dialog.accept(String(value)));
  await page
    .getByRole('button', { name: new RegExp(`^Edge ${source} to ${target},`) })
    .click();
}
async function addNode(page: Page, x: number, y: number) {
  const point = await page.locator('svg[preserveAspectRatio]').evaluate(
    (el, p) => {
      const matrix = (el as SVGSVGElement).getScreenCTM();
      if (!matrix) throw new Error('SVG transform missing');
      const point = new DOMPoint(p.x, p.y).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    },
    { x, y },
  );
  await page.mouse.click(point.x, point.y);
  return point;
}
test('grid and graph drafts remain separate and new nodes appear at the pointer', async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole('button', { name: 'Row 0, column 0: open', exact: true })
    .click();
  await page.getByRole('button', { name: 'Graph View', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Visualize', exact: true }),
  ).toBeDisabled();
  const click = await addNode(page, 200, 200);
  const location = await page.locator('[data-node-id="1"]').evaluate((el) => {
    const m = (el as SVGGraphicsElement).getScreenCTM()!;
    return { x: m.e, y: m.f };
  });
  expect(Math.hypot(location.x - click.x, location.y - click.y)).toBeLessThan(
    2,
  );
  await page.getByRole('button', { name: 'Grid View', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Row 0, column 0: wall', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Graph View', exact: true }).click();
  await expect(page.locator('[data-node-id="1"]')).toHaveCount(1);
});
test('invalid numeric grids report errors without crashing or freezing', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await page.getByLabel('Rows', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Clear Grid', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('whole-number');
  await page.getByLabel('Rows', { exact: true }).fill('1');
  await page.getByLabel('Columns', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Clear Grid', exact: true }).click();
  await page
    .getByRole('button', { name: 'Randomize Walls', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('at least two');
  expect(errors).toEqual([]);
});
test('invalid/blank arrays cannot run old data and signed values sort successfully', async ({
  page,
}) => {
  await open(page, '/sorting');
  const input = page.getByLabel('Custom Input');
  await input.fill('');
  await expect(
    page.getByRole('button', { name: 'Visualize', exact: true }),
  ).toBeDisabled();
  await input.fill('1.9,2oops');
  await expect(page.getByRole('alert')).toContainText('whole integers');
  await input.fill('3,-2,0,1');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await fast(page);
  await expect(page.getByRole('status')).toContainText('Algorithm finished.');
  expect(
    await page
      .locator('[data-value]')
      .evaluateAll((elements) =>
        elements.map((e) => Number(e.getAttribute('data-value'))),
      ),
  ).toEqual([-2, 0, 1, 3]);
  expect(
    await page
      .locator('[data-value]')
      .evaluateAll((elements) =>
        elements.every(
          (e) => Number.parseFloat((e as HTMLElement).style.height) >= 0,
        ),
      ),
  ).toBe(true);
});
test('streamed frames appear before close; reset cancels and editing stays disabled', async ({
  page,
}) => {
  let channel: WebSocketRoute | undefined;
  let closed = false;
  await page.routeWebSocket('**/ws/visualize/**', (ws) => {
    channel = ws;
    ws.onMessage(() => ws.send(JSON.stringify(frame)));
    ws.onClose(() => {
      closed = true;
    });
  });
  await open(page, '/sorting');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(frame.message);
  await expect(
    page.getByRole('button', { name: 'Generate New' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Running...', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel and reset' }).click();
  await expect(page.getByRole('status')).toHaveText('Ready.');
  await expect.poll(() => closed).toBe(true);
  expect(channel).toBeDefined();
  await expect(
    page.getByRole('button', { name: 'Generate New' }),
  ).toBeEnabled();
});
test('partial server failures are never reported as successful completion', async ({
  page,
}) => {
  await page.routeWebSocket('**/ws/visualize/**', (ws) =>
    ws.onMessage(() => {
      ws.send(JSON.stringify(frame));
      ws.close({ code: 1011, reason: 'Forced failure' });
    }),
  );
  await open(page, '/sorting');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Forced failure');
  await expect(
    page.getByText('Algorithm finished.', { exact: true }),
  ).toHaveCount(0);
});
test('graph highlights only ordered path edges and draws undirected edges once', async ({
  page,
}) => {
  await graph(page);
  await page.getByLabel('Node count').fill('3');
  await page.getByRole('button', { name: 'Mesh', exact: true }).click();
  await weight(page, 'A', 'B', 1);
  await weight(page, 'B', 'C', 1);
  await weight(page, 'A', 'C', 9);
  await expect(page.locator('[data-edge]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await fast(page);
  await expect(page.getByRole('status')).toContainText('Algorithm finished.');
  await expect(page.getByRole('status')).toContainText('Distance: 2');
  await expect(page.locator('[data-edge][data-path="true"]')).toHaveCount(2);
  await expect(page.locator('[data-edge="A:C"]')).toHaveAttribute(
    'data-path',
    'false',
  );
});
test('zero-weight edges disappear when their endpoint is deleted', async ({
  page,
}) => {
  await graph(page);
  await page.getByLabel('Node count').fill('3');
  await page.getByRole('button', { name: 'Mesh', exact: true }).click();
  await weight(page, 'A', 'B', 0);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.locator('[data-node-id="B"]').click();
  await expect(page.locator('[data-node-id="B"]')).toHaveCount(0);
  let received:
    { adjacency: Record<string, Record<string, number>> } | undefined;
  await page.routeWebSocket('**/ws/visualize/**', (ws) =>
    ws.onMessage((data) => {
      received = JSON.parse(String(data));
      ws.send(
        JSON.stringify({
          type: 'error',
          code: 'test',
          message: 'Probe finished',
        }),
      );
    }),
  );
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await expect.poll(() => received !== undefined).toBe(true);
  expect(
    Object.values(received!.adjacency).every(
      (neighbors) => !Object.hasOwn(neighbors, 'B'),
    ),
  ).toBe(true);
});
test('connection drags cancel on release outside the canvas', async ({
  page,
}) => {
  await graph(page);
  await page.getByRole('button', { name: 'Mesh', exact: true }).click();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  const node = await page.locator('[data-node-id="A"] circle').boundingBox();
  await page.mouse.move(node!.x + node!.width / 2, node!.y + node!.height / 2);
  await page.mouse.down();
  await page.mouse.move(20, 80, { steps: 4 });
  await page.mouse.up();
  await page.mouse.move(500, 500);
  await expect(page.locator('[data-connection-preview]')).toHaveCount(0);
});
test('modals trap focus, close on Escape, and restore focus', async ({
  page,
}) => {
  await open(page, '/sorting');
  const about = page.getByRole('button', { name: 'About', exact: true });
  await about.click();
  const dialog = page.getByRole('dialog', { name: 'About AlgoVisualizer' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('dialog')),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(about).toBeFocused();
});
test('metadata errors are visible and retry recovers; unknown routes show not found', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/api/algorithms', (route) =>
    fail ? route.fulfill({ status: 503, body: '{}' }) : route.continue(),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Cannot load');
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('link', { name: /^sorting$/i })).toBeVisible();
  await page.goto('/unknown-category');
  await expect(
    page.getByRole('heading', { name: 'Category not found.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Visualize', exact: true }),
  ).toHaveCount(0);
});

test('graph keyboard editing and captured pointer connections work', async ({
  page,
}) => {
  await graph(page);
  await addNode(page, 200, 200);
  await addNode(page, 400, 200);
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await page.locator('[data-node-id="1"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-node-id="2"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-edge]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: /^Edge 1 to 2,/ }).click();
  await expect(page.locator('[data-edge]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  const first = await page.locator('[data-node-id="1"] circle').boundingBox();
  const second = await page.locator('[data-node-id="2"] circle').boundingBox();
  await page.mouse.move(
    first!.x + first!.width / 2,
    first!.y + first!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    second!.x + second!.width / 2,
    second!.y + second!.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(page.locator('[data-edge]')).toHaveCount(1);
});

test('zoomed and scrolled graph positions use the same SVG transform', async ({
  page,
}) => {
  await graph(page);
  await page
    .getByRole('button', { name: 'Fit to screen', exact: true })
    .click();
  const slider = page.getByRole('slider', { name: 'Zoom', exact: true });
  await slider.focus();
  await slider.press('End');
  await page.locator('svg[preserveAspectRatio]').evaluate((el) => {
    const scroll = el.parentElement!.parentElement!;
    scroll.scrollLeft = 600;
    scroll.scrollTop = 500;
  });
  const click = await addNode(page, 600, 400);
  const actual = await page.locator('[data-node-id="1"]').evaluate((el) => {
    const m = (el as SVGGraphicsElement).getScreenCTM()!;
    return { x: m.e, y: m.f };
  });
  expect(Math.hypot(actual.x - click.x, actual.y - click.y)).toBeLessThan(2);
});

test('a failed execution can be retried and automatically plays the next result', async ({
  page,
}) => {
  let runs = 0;
  await page.routeWebSocket('**/ws/visualize/**', (ws) =>
    ws.onMessage(() => {
      runs++;
      if (runs === 1)
        ws.send(
          JSON.stringify({ type: 'error', code: 'test', message: 'Try again' }),
        );
      else {
        ws.send(JSON.stringify({ ...frame, type: 'sorted' }));
        ws.send(JSON.stringify({ type: 'complete', steps: 1 }));
        ws.close({ code: 1000 });
      }
    }),
  );
  await open(page, '/sorting');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Try again');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Algorithm finished.');
});

test('reconnecting existing graph nodes preserves zero and positive weights', async ({ page }) => {
  await graph(page);
  await page.getByLabel('Node count').fill('2');
  await page.getByRole('button', { name: 'Mesh', exact: true }).click();
  for (const value of [0, 9]) {
    await weight(page, 'A', 'B', value);
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await page.locator('[data-node-id="A"]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-node-id="B"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: `Edge A to B, weight ${value}. Edit weight.`, exact: true })).toBeVisible();
    await expect(page.locator('[data-edge]')).toHaveCount(1);
  }
});

test('an unreachable search keeps its no-path result visible after completion', async ({ page }) => {
  await open(page);
  await page.getByLabel('Rows', { exact: true }).fill('3');
  await page.getByLabel('Columns', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Clear Grid', exact: true }).click();
  for (let row = 0; row < 3; row++)
    await page.getByRole('button', { name: `Row ${row}, column 1: open`, exact: true }).click();
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await fast(page);
  await expect(page.getByRole('status')).toContainText('Algorithm finished.');
  await expect(page.getByRole('status')).toContainText('No path found.');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('execution history reaches the last message in a tall viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 2400 });
  await page.routeWebSocket('**/ws/visualize/**', (ws) => ws.onMessage(() => {
    for (let i = 1; i <= 200; i++)
      ws.send(JSON.stringify({ ...frame, message: `Trace ${i}` }));
    ws.send(JSON.stringify({ type: 'complete', steps: 200 }));
    ws.close({ code: 1000 });
  }));
  await open(page, '/sorting');
  await page.getByLabel('Custom Input').fill('2,1');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await fast(page);
  await expect(page.getByRole('status')).toContainText('Algorithm finished.');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(page.getByRole('listitem').last()).toContainText('Trace 200');
  expect(await page.getByRole('listitem').count()).toBeLessThan(70);
});

test('grid walls support pointer dragging and keyboard editing', async ({
  page,
}) => {
  await open(page);
  const first = await page
    .getByRole('button', { name: 'Row 0, column 0: open', exact: true })
    .boundingBox();
  const last = await page
    .getByRole('button', { name: 'Row 0, column 3: open', exact: true })
    .boundingBox();
  await page.mouse.move(
    first!.x + first!.width / 2,
    first!.y + first!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(last!.x + last!.width / 2, last!.y + last!.height / 2, {
    steps: 20,
  });
  await page.mouse.up();
  for (let col = 0; col < 4; col++)
    await expect(
      page.getByRole('button', {
        name: `Row 0, column ${col}: wall`,
        exact: true,
      }),
    ).toBeVisible();
  const cell = page.getByRole('button', {
    name: 'Row 0, column 0: wall',
    exact: true,
  });
  await cell.focus();
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('button', { name: 'Row 0, column 0: open', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('button', { name: 'Row 0, column 1: wall', exact: true }),
  ).toBeFocused();
});
