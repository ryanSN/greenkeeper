// const kit = require('../../lib/gk-kit')

describe('invalid-config-file', async () => {
  beforeEach(() => {
    jest.resetModules()
  })

  jest.mock('../../lib/dbs')
  const dbs = require('../../lib/dbs')

  // Remove all DB calls
  const noop = () => ''
  dbs.mockImplementation(() => ({
    installations: {
      get: noop()
    },
    repositories: {
      get: noop(),
      query: noop()
    }
  }))

  test('create new issue', async () => {
    expect.assertions(6)
    jest.mock('../../lib/gk-kit', (accountId) => (accountId) => {
      expect(accountId).toEqual('2020')
      const lib = require.requireActual('../../lib/gk-kit')
      lib.repositories = (repositoryId) => {
        expect(repositoryId).toEqual('invalid-config1')
        return {
          issues: {
            getInvalidConfigIssues: () => {
              return []
            },
            create: (title, body, issueDoc) => {
              expect(title).toEqual('Invalid Greenkeeper configuration file')
              expect(body).toMatch('The group name `#invalid#groupname#` is invalid. Group names may only contain alphanumeric characters and underscores (a-zA-Z_).')
              expect(body).not.toMatch(/which is preventing Greenkeeper from opening its initial pull request/)
              expect(issueDoc).toMatchObject({
                initial: false,
                invalidConfig: true
              })
            }
          }
        }
      }
      return lib
    })
    const invalidConfigFile = require('../../jobs/invalid-config-file')

    await invalidConfigFile({
      repositoryId: 'invalid-config1',
      accountId: '2020',
      messages: ['The group name `#invalid#groupname#` is invalid. Group names may only contain alphanumeric characters and underscores (a-zA-Z_).']
    })
  })

  test('an open issue already exists', async () => {
    expect.assertions(3)
    jest.mock('../../lib/gk-kit', (accountId) => (accountId) => {
      expect(accountId).toEqual('2121')
      const lib = require.requireActual('../../lib/gk-kit')
      lib.repositories = (repositoryId) => {
        expect(repositoryId).toEqual('invalid-config2')
        return {
          issues: {
            getInvalidConfigIssues: () => {
              return [{issue: 'Yes'}]
            }
          }
        }
      }
      return lib
    })

    const invalidConfigFile = require('../../jobs/invalid-config-file')

    await expect(invalidConfigFile({
      repositoryId: 'invalid-config2',
      accountId: '2121'
    })).rejects.toThrow('Repo already has an open issue')
  })

  test('create new issue with reference to delayed initial PR', async () => {
    expect.assertions(8)
    jest.mock('../../lib/gk-kit', (accountId) => (accountId) => {
      expect(accountId).toEqual('2020')
      const lib = require.requireActual('../../lib/gk-kit')
      lib.repositories = (repositoryId) => {
        expect(repositoryId).toEqual('invalid-config4')
        return {
          issues: {
            getInvalidConfigIssues: () => {
              return []
            },
            create: (title, body, issueDoc) => {
              expect(title).toEqual('Invalid Greenkeeper configuration file')
              expect(body).toMatch(/We found the following issue:/)
              expect(body).toMatch(/1. The group name `#invalid#groupname#` is invalid./)
              expect(body).toMatch(/which is preventing Greenkeeper from opening its initial pull request/)
              expect(body).toMatch(/so Greenkeeper can run on this repository/)
              expect(issueDoc).toMatchObject({
                initial: false,
                invalidConfig: true
              })
            }
          }
        }
      }
      return lib
    })

    const invalidConfigFile = require('../../jobs/invalid-config-file')

    await invalidConfigFile({
      repositoryId: 'invalid-config4',
      accountId: '2020',
      messages: ['The group name `#invalid#groupname#` is invalid. Group names may only contain alphanumeric characters and underscores (a-zA-Z_).'],
      isBlockingInitialPR: true
    })
  })
})
